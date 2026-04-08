import datetime
from collections import defaultdict

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api.serializers.meal_planning import (
  MealPlanEntryCreateSerializer,
  MealPlanEntrySerializer,
)
from meal_planning.models import MealPlanEntry
from meal_planning.services.macros import compute_daily_macros, get_user_targets
from recipes.models import Recipe


def _snap_to_sunday(date: datetime.date) -> datetime.date:
  """
  Return the Sunday on or before the given date.

  Params:
    date: Any calendar date.

  Returns:
    The nearest preceding Sunday (or the date itself if it is already Sunday).
  """
  # weekday(): Monday=0 ... Sunday=6
  days_since_sunday = (date.weekday() + 1) % 7
  return date - datetime.timedelta(days=days_since_sunday)


class WeekPlanView(APIView):
  """
  GET /api/meal-plan/week/?week_start=YYYY-MM-DD

  Returns the 7-day meal plan grid for the authenticated user starting from the
  provided date (snapped to the containing Sunday). Each day contains all five
  meal slots; unfilled slots are null.

  Uses a single DB query via select_related to avoid N+1.
  """

  permission_classes = [IsAuthenticated]

  def get(self, request: Request) -> Response:
    """
    Params:
      week_start (query): ISO date string for the start of the week.

    Returns:
      200 with the week grid, or 400 if week_start is missing/malformed.
    """
    raw = request.query_params.get("week_start")
    if not raw:
      return Response(
        {"detail": "week_start query parameter is required."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    try:
      week_start = datetime.date.fromisoformat(raw)
    except ValueError:
      return Response(
        {"detail": "week_start must be a valid ISO date (YYYY-MM-DD)."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    week_start = _snap_to_sunday(week_start)
    week_end = week_start + datetime.timedelta(days=6)

    # Single query: joins to recipe via select_related
    entries = (
      MealPlanEntry.objects
      .filter(user=request.user, date__range=(week_start, week_end))
      .select_related("recipe")
    )

    # Index entries by (date, slot) for O(1) lookup during assembly
    entry_map: dict[tuple[datetime.date, str], MealPlanEntry] = {}
    for entry in entries:
      entry_map[(entry.date, entry.meal_slot)] = entry

    slots = [s.value for s in MealPlanEntry.MealSlot]
    days = []
    for i in range(7):
      day = week_start + datetime.timedelta(days=i)
      meals: dict[str, dict | None] = {}
      for slot in slots:
        entry = entry_map.get((day, slot))
        meals[slot] = MealPlanEntrySerializer(entry).data if entry else None
      days.append({"date": day.isoformat(), "meals": meals})

    return Response({"week_start": week_start.isoformat(), "days": days})


class DailyMacrosView(APIView):
  """
  GET /api/meal-plan/macros/?date=YYYY-MM-DD

  Returns aggregated macro totals for all meals planned on the given date,
  alongside the user's daily macro targets. Uses 2 DB queries.
  """

  permission_classes = [IsAuthenticated]

  def get(self, request: Request) -> Response:
    """
    Params:
      date (query): ISO date string.

    Returns:
      200 with totals and targets, or 400 if date is missing/malformed.
    """
    raw = request.query_params.get("date")
    if not raw:
      return Response(
        {"detail": "date query parameter is required."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    try:
      date = datetime.date.fromisoformat(raw)
    except ValueError:
      return Response(
        {"detail": "date must be a valid ISO date (YYYY-MM-DD)."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    totals = compute_daily_macros(request.user, date)
    targets = get_user_targets(request.user)

    return Response({
      "date": date.isoformat(),
      "totals": {k: str(v) for k, v in totals.items()},
      "targets": targets,
    })


class MealPlanEntryCreateView(APIView):
  """
  POST /api/meal-plan/entry/

  Assigns a recipe to a meal slot on a date for the authenticated user.
  If the slot is already occupied, the existing entry is replaced (upsert).

  Returns 201 on creation, 200 on replacement.
  """

  permission_classes = [IsAuthenticated]

  def post(self, request: Request) -> Response:
    """
    Body params:
      date (str): ISO date string.
      meal_slot (str): One of breakfast | snack1 | lunch | snack2 | dinner.
      recipe_id (int): PK of the Recipe to assign.

    Returns:
      201 or 200 with the serialized entry, or 400/404 on validation error.
    """
    serializer = MealPlanEntryCreateSerializer(data=request.data)
    if not serializer.is_valid():
      return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    recipe = get_object_or_404(Recipe, pk=data["recipe_id"])

    entry, created = MealPlanEntry.objects.update_or_create(
      user=request.user,
      date=data["date"],
      meal_slot=data["meal_slot"],
      defaults={"recipe": recipe},
    )

    response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(MealPlanEntrySerializer(entry).data, status=response_status)


class MealPlanEntryDeleteView(APIView):
  """
  DELETE /api/meal-plan/entry/<int:pk>/

  Removes a meal plan entry. Only the owning user can delete.
  Returns 404 if the entry does not exist or belongs to a different user.
  """

  permission_classes = [IsAuthenticated]

  def delete(self, request: Request, pk: int) -> Response:
    """
    Params:
      pk (path): Primary key of the MealPlanEntry to delete.

    Returns:
      204 No Content on success, 404 if not found or unauthorized.
    """
    entry = get_object_or_404(MealPlanEntry, pk=pk, user=request.user)
    entry.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
