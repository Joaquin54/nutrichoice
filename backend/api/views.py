from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models_mongo import Task

# Create your views here.


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class TaskListCreateView(APIView):
    def get(self, request):
        data = [{"id": str(t.id), "title": t.title} for t in Task.objects]
        return Response(data)

    def post(self, request):
        title = request.data.get("title", "").strip()
        if not title:
            return Response({"error": "title required"}, status=400)

        task = Task(title=title).save()
        return Response({"id": str(task.id), "title": task.title}, status=201)





