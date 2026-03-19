from dataclasses import dataclass
from typing import Optional
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model
from social.models import UserFollow, UserBlock

User = get_user_model()


@dataclass(frozen=True)
class BlockResult:
    ok: bool
    action: Optional[str] = None
    reason: Optional[str] = None
    changed: bool = False


def _delete_follows_between(user_a: User, user_b: User) -> int:
    """
    Deletes follow edges in BOTH directions:
      user_a -> user_b
      user_b -> user_a

    Returns number of deleted rows.
    """
    deleted_count, _ = UserFollow.objects.filter(
        Q(follower=user_a, followee=user_b) |
        Q(follower=user_b, followee=user_a)
    ).delete()
    return deleted_count


@transaction.atomic
def block_user(*, blocker: User, blocked: User) -> BlockResult:
    """
    Create a block edge blocker -> blocked.
    Also removes follow relationships between the two users (both directions).
    """
    # Rule: can't block yourself
    if blocker.pk == blocked.pk:
        return BlockResult(ok=False, reason="self_block")

    # Create block if it doesn't exist
    _, created = UserBlock.objects.get_or_create(
        blocker=blocker,
        blocked=blocked,
    )

    # Always enforce the "no relationship" rule by removing follows,
    # even if the block already existed (safety + consistency).
    _delete_follows_between(blocker, blocked)

    if not created:
        return BlockResult(ok=True, action=None, reason="already_blocked", changed=False)

    return BlockResult(ok=True, action="blocked", changed=True)


@transaction.atomic
def unblock_user(*, blocker: User, blocked: User) -> BlockResult:
    """
    Remove a block edge blocker -> blocked.
    """
    if blocker.pk == blocked.pk:
        return BlockResult(ok=False, reason="self_block")

    deleted_count, _ = UserBlock.objects.filter(
        blocker=blocker,
        blocked=blocked,
    ).delete()

    if deleted_count == 0:
        return BlockResult(ok=True, action=None, reason="not_blocked", changed=False)

    return BlockResult(ok=True, action="unblocked", changed=True)


@transaction.atomic
def toggle_block(*, blocker: User, blocked: User) -> BlockResult:
    """
    If currently blocked -> unblock.
    If not blocked -> block and remove follow relationships.
    """
    if blocker.pk == blocked.pk:
        return BlockResult(ok=False, reason="self_block")

    existing = UserBlock.objects.filter(blocker=blocker, blocked=blocked)

    if existing.exists():
        existing.delete()
        return BlockResult(ok=True, action="unblocked", changed=True)

    # Not blocked yet -> block and cleanup follows
    UserBlock.objects.create(blocker=blocker, blocked=blocked)
    _delete_follows_between(blocker, blocked)
    return BlockResult(ok=True, action="blocked", changed=True)
