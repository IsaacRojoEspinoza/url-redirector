from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ======================
# 🔐 USUARIOS
# ======================

def get_user_by_email(db: Session, email: str):
    """Obtiene un usuario por email"""
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario con contraseña hasheada"""
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain_password: str, hashed_password: str):
    """Verifica contraseña en texto plano contra hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ======================
# 🔗 REDIRECCIONES
# ======================

def create_redirect(db: Session, redirect: schemas.RedirectCreate, user_id: int):
    """Crea una redirección asociada a un usuario"""
    db_redirect = models.Redirect(
        shortcode=redirect.shortcode,
        target_url=redirect.target_url,
        owner_id=user_id,
    )
    db.add(db_redirect)
    db.commit()
    db.refresh(db_redirect)
    return db_redirect


def get_redirect_by_shortcode(db: Session, shortcode: str):
    """Busca una redirección por shortcode"""
    return db.query(models.Redirect).filter(models.Redirect.shortcode == shortcode).first()


def get_user_redirects(db: Session, user_id: int):
    """Obtiene todas las redirecciones de un usuario"""
    return db.query(models.Redirect).filter(models.Redirect.owner_id == user_id).all()


def get_redirect_by_id_and_owner(db: Session, redirect_id: int, user_id: int):
    """Busca una redirección por ID y propietario"""
    return (
        db.query(models.Redirect)
        .filter(models.Redirect.id == redirect_id, models.Redirect.owner_id == user_id)
        .first()
    )


def delete_redirect(db: Session, redirect_id: int, user_id: int):
    """Elimina una redirección solo si pertenece al usuario"""
    db_redirect = get_redirect_by_id_and_owner(db, redirect_id, user_id)
    if not db_redirect:
        return None
    db.delete(db_redirect)
    db.commit()
    return db_redirect


def edit_redirect(
    db: Session,
    redirect_id: int,
    user_id: int,
    updated_data: schemas.RedirectUpdate,
):
    """Edita una redirección si pertenece al usuario"""
    db_redirect = get_redirect_by_id_and_owner(db, redirect_id, user_id)
    if not db_redirect:
        return None

    if updated_data.shortcode is not None:
        db_redirect.shortcode = updated_data.shortcode
    if updated_data.target_url is not None:
        db_redirect.target_url = updated_data.target_url

    db.commit()
    db.refresh(db_redirect)
    return db_redirect