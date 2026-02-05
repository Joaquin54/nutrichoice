from dataclasses import dataclass
from typing import Optional
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model
from social.models import UserFollow, UserBlock

User = get_user_model()


@dataclass(frozen=True)
class FollowResult:
    ok: bool
    action: Optional[str] = None
    reason: Optional[str] = None
    changed: bool = False


def _blocked_either_direction(user_a: User, user_b: User) -> bool:  # type:ignore
    """
    Will return True if A blocked B or B blocked A
    """
    return UserBlock.objects.filter(  # type: ignore
        Q(blocker=user_a, blocked=user_b) | Q(blocker=user_b, blocked=user_a)
    ).exists()


@transaction.atomic
def follow_user(*, follower: User, followee: User) -> FollowResult:  # type: ignore
    """
    Create follower -> followee edge if allowed
    """
    if follower.pk == followee.pk:
        return FollowResult(ok=False, reason="self_follow")

    if _blocked_either_direction(follower, followee):
        return FollowResult(ok=False, reason="blocked")

    _, created = UserFollow.objects.get_or_create(  # type: ignore
        follower=follower,
        followee=followee,
    )

    if not created:
        return FollowResult(ok=True, action=None, reason="already_following")

    return FollowResult(ok=True, action="following", changed=True)


@transaction.atomic
def unfollow_user(*, follower: User, followee: User) -> FollowResult:  # type: ignore
    if follower.pk == followee.pk:
        return FollowResult(ok=False, reason="self_follow")

    deleted_count, _ = UserFollow.objects.filter(  # type: ignore
        follower=follower,
        followee=followee
    ).delete()

    if deleted_count == 0:
        return FollowResult(
            ok=True, action=None, reason="not_following", changed=False)

    return FollowResult(ok=True, action="unfollowed", changed=True)


@transaction.atomic
def toggle_follow(*, follower: User, followee: User) -> FollowResult:  # type: ignore
    if follower.pk == followee.pk:
        return FollowResult(ok=False, reason="self_follow")

    if _blocked_either_direction(follower, followee):
        return FollowResult(ok=False, reason="blocked")

    deleted_count, _ = UserFollow.objects.filter(  # type: ignore
        follower=follower, followee=followee
    ).delete()

    if deleted_count > 0:
        return FollowResult(ok=True, action="unfollowed", changed=True)

    UserFollow.objects.create(  # type: ignore
        follower=follower, followee=followee
    )
    return FollowResult(ok=True, action="followed", changed=True)
