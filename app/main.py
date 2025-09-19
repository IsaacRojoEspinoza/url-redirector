from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, schemas, auth, models
from .database import Base, engine, get_db
import os

# Crear tablas en la BD
models.Base.metadata.create_all(bind=engine)

# Inicializar app
app = FastAPI(title="URL Redirector")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path al frontend
frontend_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)
app.mount("/static", StaticFiles(directory=frontend_path, html=True), name="static")

# ========================
#   ENDPOINTS DE AUTHS
# ========================

@app.post("/api/register", response_model=schemas.Token)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    created_user = crud.create_user(db=db, user=user)
    access_token = auth.create_access_token(data={"sub": created_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ========================
#   ENDPOINTS DE REDIRECTS
# ========================

@app.post("/api/redirects/", response_model=schemas.RedirectResponse)
async def create_redirect(
    redirect: schemas.RedirectCreate,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    existing = crud.get_redirect_by_shortcode(db, redirect.shortcode)
    if existing:
        raise HTTPException(status_code=400, detail="Shortcode already taken")
    created = crud.create_redirect(db=db, redirect=redirect, user_id=current_user.id)
    return schemas.RedirectResponse.model_validate(created)


@app.get("/api/redirects/", response_model=schemas.RedirectList)
async def list_redirects(
    current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)
):
    redirects = crud.get_user_redirects(db, user_id=current_user.id)
    return {"redirects": [schemas.RedirectResponse.model_validate(r) for r in redirects]}


@app.delete("/api/redirects/{redirect_id}")
async def delete_redirect(
    redirect_id: int,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    deleted = crud.delete_redirect(db, redirect_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Redirect not found")
    return {"msg": "Deleted"}

@app.put("/api/redirects/{redirect_id}", response_model=schemas.RedirectResponse)
async def update_redirect(
    redirect_id: int,
    redirect_update: schemas.RedirectUpdate,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Validar si el shortcode nuevo ya existe (y no es el mismo redirect)
    if redirect_update.shortcode:
        existing = crud.get_redirect_by_shortcode(db, redirect_update.shortcode)
        if existing and existing.id != redirect_id:
            raise HTTPException(status_code=400, detail="Shortcode already taken")

    updated = crud.edit_redirect(
        db=db,
        redirect_id=redirect_id,
        user_id=current_user.id,
        updated_data=redirect_update,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Redirect not found or unauthorized")
    return schemas.RedirectResponse.model_validate(updated)

# ========================
#   CATCH-ALL PARA FRONTEND Y SHORTCODES
# ========================

@app.api_route("/{path:path}", methods=["GET"], response_class=HTMLResponse)
async def serve_react_app(path: str):
    # ⚡ IMPORTANTE: si es endpoint de API o estático, no lo manejamos aquí
    if path.startswith("api") or path.startswith("static"):
        raise HTTPException(status_code=404, detail="Not found")

    # Rutas de React SPA
    if path in ["", "login", "register", "redirects"]:
        return FileResponse(os.path.join(frontend_path, "index.html"))

    # Buscar shortcodes
    db = next(get_db())
    redirect = crud.get_redirect_by_shortcode(db, path)
    if redirect:
        return RedirectResponse(url=redirect.target_url, status_code=301)

    raise HTTPException(status_code=404, detail="Not found")
