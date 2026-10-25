import argparse
import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.infrastructure.database.session import SessionLocal
from app.infrastructure.database.models.user_profile_model import UserProfileModel, RoleAuditLogModel


def promote_user(email: str, reason: str = "CLI bootstrap promotion") -> None:
    db: Session = SessionLocal()
    try:
        clean_email = email.strip().lower()
        user = db.query(UserProfileModel).filter(UserProfileModel.email == clean_email).first()

        now = datetime.now(timezone.utc)
        if not user:
            print(f"Creating new administrator record for '{clean_email}'...")
            user = UserProfileModel(
                id=str(uuid.uuid4()),
                email=clean_email,
                full_name="Bootstrap Administrator",
                role="admin",
                is_active=True,
                last_login_at=now,
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        old_role = user.role
        user.role = "admin"
        user.is_active = True
        user.updated_at = now

        audit = RoleAuditLogModel(
            user_id=user.id,
            changed_by_admin_id=None,
            old_role=old_role,
            new_role="admin",
            reason=f"[CLI Promotion] {reason}",
        )
        db.add(audit)
        db.commit()
        print(f"Successfully promoted '{clean_email}' (UUID: {user.id}) to 'admin'. Audit log recorded.")
    except Exception as e:
        db.rollback()
        print(f"Error during promotion: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def demote_user(email: str, reason: str = "CLI demotion") -> None:
    db: Session = SessionLocal()
    try:
        clean_email = email.strip().lower()
        user = db.query(UserProfileModel).filter(UserProfileModel.email == clean_email).first()
        if not user:
            print(f"Error: User with email '{clean_email}' not found.", file=sys.stderr)
            sys.exit(1)

        other_admins = (
            db.query(UserProfileModel)
            .filter(
                UserProfileModel.role == "admin",
                UserProfileModel.is_active == True,
                UserProfileModel.id != user.id,
            )
            .count()
        )
        if other_admins == 0:
            print("Error: Cannot demote the sole active administrator.", file=sys.stderr)
            sys.exit(1)

        old_role = user.role
        user.role = "citizen"
        now = datetime.now(timezone.utc)
        user.updated_at = now

        audit = RoleAuditLogModel(
            user_id=user.id,
            changed_by_admin_id=None,
            old_role=old_role,
            new_role="citizen",
            reason=f"[CLI Demotion] {reason}",
        )
        db.add(audit)
        db.commit()
        print(f"Successfully demoted '{clean_email}' to 'citizen'. Audit log recorded.")
    except Exception as e:
        db.rollback()
        print(f"Error during demotion: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def list_users() -> None:
    db: Session = SessionLocal()
    try:
        users = db.query(UserProfileModel).order_by(UserProfileModel.created_at.desc()).all()
        print(f"\nTotal Registered Users: {len(users)}\n" + "-" * 80)
        print(f"{'Role':<10} | {'Active':<7} | {'Email':<32} | {'ID':<36}")
        print("-" * 80)
        for u in users:
            print(f"{u.role:<10} | {str(u.is_active):<7} | {u.email:<32} | {u.id:<36}")
        print("-" * 80 + "\n")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="WasteSense AI RBAC & Administrator CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available admin commands")

    # Promote command
    promote_parser = subparsers.add_parser("promote", help="Promote a user to municipal administrator")
    promote_parser.add_argument("--email", required=True, help="User email to promote")
    promote_parser.add_argument("--reason", default="Initial bootstrap", help="Audit reason for promotion")

    # Demote command
    demote_parser = subparsers.add_parser("demote", help="Demote an administrator to citizen")
    demote_parser.add_argument("--email", required=True, help="User email to demote")
    demote_parser.add_argument("--reason", default="CLI demotion", help="Audit reason for demotion")

    # List command
    subparsers.add_parser("list", help="List all registered user accounts and their roles")

    args = parser.parse_args()

    if args.command == "promote":
        promote_user(email=args.email, reason=args.reason)
    elif args.command == "demote":
        demote_user(email=args.email, reason=args.reason)
    elif args.command == "list":
        list_users()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
