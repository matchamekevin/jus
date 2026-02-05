#!/bin/bash

# 🚀 SCRIPT UNIQUE COMPLET - JUS LOCAUX TOGO
# Tout en un : installation Docker + démarrage PostgreSQL + serveurs + tests

set -e

echo "🥤 JUS LOCAUX TOGO - Script Complet"
echo "==================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction d'installation automatique de Docker
install_docker_auto() {
    echo -e "${BLUE}🐳 Installation automatique de Docker...${NC}"
    echo ""

    # Vérifier si on est dans Flatpak (environnement limité)
    if ! command -v sudo &> /dev/null && command -v flatpak-spawn &> /dev/null; then
        echo -e "${YELLOW}⚠️  Environnement Flatpak détecté${NC}"
        echo ""
        echo -e "${GREEN}Instructions pour installer Docker :${NC}"
        echo ""
        echo "1) Ouvrez un terminal normal (pas VSCode) et exécutez :"
        echo -e "${GREEN}   sudo apt update${NC}"
        echo -e "${GREEN}   sudo apt install -y docker.io docker-compose${NC}"
        echo -e "${GREEN}   sudo systemctl enable --now docker${NC}"
        echo -e "${GREEN}   sudo usermod -aG docker \$USER${NC}"
        echo ""
        echo -e "${YELLOW}2) Redémarrez votre session ou exécutez :${NC}"
        echo -e "${YELLOW}   newgrp docker${NC}"
        echo ""
        echo -e "${GREEN}3) Revenez ici et relancez :${NC}"
        echo -e "${GREEN}   sh start.sh${NC}"
        echo ""
        exit 0
    fi

    # Vérifier si on est root
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Ce script doit être exécuté en root pour installer Docker${NC}"
        echo ""
        echo -e "${GREEN}Utilisez :${NC}"
        echo "sudo $0 install-docker"
        exit 1
    fi

    echo -e "${YELLOW}📦 Mise à jour des paquets...${NC}"
    apt update

    echo -e "${YELLOW}📦 Installation de Docker...${NC}"
    apt install -y docker.io docker-compose

    echo -e "${YELLOW}🔧 Activation de Docker...${NC}"
    systemctl enable --now docker

    echo -e "${YELLOW}👤 Ajout de l'utilisateur au groupe docker...${NC}"
    # Obtenir le nom de l'utilisateur qui a lancé sudo
    if [ -n "$SUDO_USER" ]; then
        USER_TO_ADD=$SUDO_USER
    else
        USER_TO_ADD=$USER
    fi

    usermod -aG docker $USER_TO_ADD

    echo ""
    echo -e "${GREEN}🎉 Docker installé avec succès !${NC}"
    echo -e "${YELLOW}⚠️  Redémarrez votre session ou exécutez : newgrp docker${NC}"
    echo ""
}

# Fonction pour vérifier PostgreSQL
check_postgres() {
    if nc -z localhost 5432 2>/dev/null; then
        return 0
    fi
    return 1
}

# Fonction pour démarrer PostgreSQL avec Docker
start_postgres_docker() {
    echo -e "${YELLOW}📦 Démarrage de PostgreSQL avec Docker...${NC}"

    # Détecter Docker : direct ou via flatpak-spawn
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker-compose"
    
    if ! command -v docker &> /dev/null; then
        # Essayer via flatpak-spawn
        if flatpak-spawn --host docker --version &> /dev/null; then
            echo -e "${GREEN}✅ Docker détecté sur le système hôte${NC}"
            DOCKER_CMD="flatpak-spawn --host docker"
            DOCKER_COMPOSE_CMD="flatpak-spawn --host docker-compose"
            
            # Vérifier les permissions Docker
            if ! $DOCKER_CMD ps &> /dev/null; then
                # Essayer avec sg docker (changement de groupe temporaire)
                if flatpak-spawn --host sg docker -c "docker ps" &> /dev/null; then
                    echo -e "${GREEN}✅ Accès Docker via groupe docker${NC}"
                    DOCKER_CMD="flatpak-spawn --host sg docker -c"
                    DOCKER_COMPOSE_CMD="flatpak-spawn --host sg docker -c"
                    USE_SG=true
                else
                    echo -e "${YELLOW}⚠️  Permission Docker refusée - utilisation de sudo${NC}"
                    DOCKER_CMD="flatpak-spawn --host sudo docker"
                    DOCKER_COMPOSE_CMD="flatpak-spawn --host sudo docker-compose"
                    
                    # Vérifier que sudo fonctionne
                    if ! $DOCKER_CMD ps &> /dev/null; then
                        echo -e "${RED}❌ Impossible d'accéder à Docker même avec sudo${NC}"
                        echo ""
                        echo -e "${GREEN}🔧 Ouvrez un TERMINAL SYSTÈME (Ctrl+Alt+T) et exécutez :${NC}"
                        echo -e "${GREEN}   sudo usermod -aG docker \$USER${NC}"
                        echo -e "${GREEN}   newgrp docker${NC}"
                        echo ""
                        echo "Puis redémarrez VSCode et relancez : sh start.sh"
                        exit 1
                    fi
                fi
            fi
        else
            echo -e "${RED}❌ Docker n'est pas installé${NC}"
            echo ""
            
            # Vérifier si sudo est disponible
            if ! command -v sudo &> /dev/null; then
            echo -e "${YELLOW}⚠️  Environnement Flatpak détecté (sudo non disponible)${NC}"
            echo ""
            echo -e "${GREEN}🔧 Instructions pour installer Docker :${NC}"
            echo ""
            echo "1) Ouvrez un TERMINAL SYSTÈME (pas celui de VSCode) :"
            echo "   - Appuyez sur Ctrl+Alt+T"
            echo "   - Ou cherchez 'Terminal' dans vos applications"
            echo ""
            echo "2) Dans ce terminal, exécutez :"
            echo -e "${GREEN}   sudo apt update${NC}"
            echo -e "${GREEN}   sudo apt install -y docker.io docker-compose${NC}"
            echo -e "${GREEN}   sudo systemctl enable --now docker${NC}"
            echo -e "${GREEN}   sudo usermod -aG docker \$USER${NC}"
            echo ""
            echo "3) Redémarrez VSCode et relancez :"
            echo -e "${GREEN}   sh start.sh${NC}"
            echo ""
        else
            echo -e "${GREEN}Installation automatique :${NC}"
            echo "  sudo $0 install-docker"
            echo ""
        fi
            exit 1
        fi
    fi

    # Démarrer le conteneur PostgreSQL
    if [ "$USE_SG" = true ]; then
        flatpak-spawn --host sg docker -c "cd /home/kev/jus && docker-compose up -d postgres"
    else
        $DOCKER_COMPOSE_CMD up -d postgres
    fi

    echo -e "${YELLOW}⏳ Attente de PostgreSQL...${NC}"
    sleep 5

    # Vérifier que PostgreSQL est prêt
    for i in {1..30}; do
        if [ "$USE_SG" = true ]; then
            if flatpak-spawn --host sg docker -c "docker exec jus_postgres pg_isready -U jus_user -d jus_db" 2>/dev/null; then
                echo -e "${GREEN}✅ PostgreSQL est prêt !${NC}"
                return 0
            fi
        else
            if $DOCKER_CMD exec jus_postgres pg_isready -U jus_user -d jus_db 2>/dev/null; then
                echo -e "${GREEN}✅ PostgreSQL est prêt !${NC}"
                return 0
            fi
        fi
        sleep 1
    done

    echo -e "${RED}❌ PostgreSQL n'a pas démarré${NC}"
    echo "Logs : docker-compose logs postgres"
    exit 1
}

# Fonction de test rapide
run_tests() {
    echo ""
    echo -e "${BLUE}🧪 Tests automatiques${NC}"
    echo "=================="
    echo ""

    # Test PostgreSQL
    echo -e "${YELLOW}🔍 PostgreSQL...${NC}"
    if docker ps | grep -q jus_postgres; then
        echo -e "${GREEN}✅ PostgreSQL (Docker) : OK${NC}"
    elif nc -z localhost 5432 2>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL (local) : OK${NC}"
    else
        echo -e "${RED}❌ PostgreSQL : NOK${NC}"
    fi

    # Test backend
    echo -e "${YELLOW}🔍 Backend (port 4000)...${NC}"
    if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend : OK${NC}"

        # Test API produits
        if curl -s http://localhost:4000/api/products | grep -q '"name"'; then
            echo -e "${GREEN}✅ API Produits : OK${NC}"
        else
            echo -e "${RED}❌ API Produits : NOK${NC}"
        fi

        # Test API livraisons
        if curl -s http://localhost:4000/api/deliveries | grep -q '"zone"'; then
            echo -e "${GREEN}✅ API Livraisons : OK${NC}"
        else
            echo -e "${RED}❌ API Livraisons : NOK${NC}"
        fi
    else
        echo -e "${RED}❌ Backend : NOK${NC}"
    fi

    # Test frontend
    echo -e "${YELLOW}🔍 Frontend (port 5173)...${NC}"
    if curl -s http://localhost:5173 | grep -q "JUS LOCAUX"; then
        echo -e "${GREEN}✅ Frontend : OK${NC}"
    else
        echo -e "${RED}❌ Frontend : NOK${NC}"
    fi

    echo ""
    echo -e "${GREEN}🎯 Tests terminés !${NC}"
}

# Fonction principale de démarrage
start_app() {
    # Créer le dossier logs
    mkdir -p logs

    # Vérifier et installer les dépendances backend
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
        cd backend && npm install && cd ..
    else
        echo -e "${GREEN}✅ Dépendances backend OK${NC}"
    fi

    # Vérifier et installer les dépendances frontend
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
        cd frontend && npm install && cd ..
    else
        echo -e "${GREEN}✅ Dépendances frontend OK${NC}"
    fi

    # Vérifier et installer les dépendances admin
    if [ ! -d "admin/node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances admin...${NC}"
        cd admin && npm install && cd ..
    else
        echo -e "${GREEN}✅ Dépendances admin OK${NC}"
    fi

    # Vérifier le fichier .env
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}⚙️  Création du fichier .env...${NC}"
        cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://jus_user:jus_password_2026@localhost:5432/jus_db
ADMIN_API_KEY=admin_key_2026_jus_togo_secure
PORT=4000
EOF
        echo -e "${GREEN}✅ Fichier .env créé${NC}"
    fi

    # Appliquer les migrations si le script existe
    if [ -f "backend/scripts/migrate_db.js" ]; then
        echo -e "${YELLOW}🔁 Application des migrations DB...${NC}"
        node backend/scripts/migrate_db.js || echo -e "${RED}⚠️  Échec des migrations (voir logs)${NC}"
    fi

    echo ""
    echo -e "${GREEN}🚀 Démarrage des serveurs...${NC}"
    echo ""

    # Arrêter les anciens processus
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true

    # Démarrer le backend en arrière-plan
    echo -e "${YELLOW}🔧 Backend : http://localhost:4000${NC}"
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    # Attendre que le backend démarre
    sleep 3

    # Vérifier que le backend tourne
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Erreur de démarrage du backend${NC}"
        echo "Logs : tail -f logs/backend.log"
        exit 1
    fi

    echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"

    # Démarrer l'admin en arrière-plan
    echo -e "${YELLOW}👤 Admin : http://localhost:5174${NC}"
    cd admin
    npm run dev > ../logs/admin.log 2>&1 &
    ADMIN_PID=$!
    cd ..

    sleep 2
    echo -e "${GREEN}✅ Admin démarré (PID: $ADMIN_PID)${NC}"

    # Démarrer le frontend
    echo -e "${YELLOW}🎨 Frontend : http://localhost:5173${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Application démarrée avec succès !${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Accédez à l'application :"
    echo "  🌐 Frontend : http://localhost:5173"
    echo "  ⚙️  Backend  : http://localhost:4000"
    echo "  👤 Admin    : http://localhost:5174"
    echo ""
    echo "Identifiants Admin :"
    echo "  👤 Utilisateur : admin"
    echo "  🔑 Mot de passe : justogo2026"
    echo ""
    echo "Logs :"
    echo "  Backend : tail -f logs/backend.log"
    echo "  Admin   : tail -f logs/admin.log"
    echo ""
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter${NC}"
    echo ""

    # Fonction de nettoyage
    cleanup() {
        echo ""
        echo -e "${YELLOW}🛑 Arrêt des serveurs...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        kill $ADMIN_PID 2>/dev/null || true
        pkill -f "vite" 2>/dev/null || true
        echo -e "${GREEN}✅ Serveurs arrêtés${NC}"
        exit 0
    }

    # Capturer Ctrl+C
    trap cleanup INT TERM

    # Démarrer le frontend (bloquant)
    cd frontend
    npm run dev

    # Si le frontend s'arrête, nettoyer
    cleanup
}

# Gestion des arguments
case "${1:-}" in
    "install-docker")
        install_docker_auto
        ;;
    "test")
        run_tests
        ;;
    *)
        # Démarrage normal
        if check_postgres; then
            echo -e "${GREEN}✅ PostgreSQL est déjà en cours d'exécution${NC}"
        else
            echo -e "${YELLOW}⚠️  PostgreSQL n'est pas accessible${NC}"
            echo ""
            start_postgres_docker
        fi

        start_app
        ;;
esac

# Vérifier si PostgreSQL tourne
if check_postgres; then
    echo -e "${GREEN}✅ PostgreSQL est déjà en cours d'exécution${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas accessible${NC}"
    echo ""
    echo "Options :"
    echo "  1) Démarrer avec Docker (recommandé)"
    echo "  2) Installer PostgreSQL sur le système"
    echo "  3) Quitter"
    echo ""
    read -p "Votre choix (1/2/3) : " choice
    
    case $choice in
        1)
            start_postgres_docker
            ;;
        2)
            echo ""
            echo "Exécutez ces commandes dans l'ordre :"
            echo "  sh scripts/install-postgres.sh"
            echo "  sh scripts/setup-database.sh"
            echo "  sh start.sh"
            exit 0
            ;;
        *)
            echo "Annulé."
            exit 0
            ;;
    esac
fi

# Créer le dossier logs
mkdir -p logs

# Vérifier et installer les dépendances backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
    cd backend && npm install && cd ..
else
    echo -e "${GREEN}✅ Dépendances backend OK${NC}"
fi

# Vérifier et installer les dépendances frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
    cd frontend && npm install && cd ..
else
    echo -e "${GREEN}✅ Dépendances frontend OK${NC}"
fi

# Vérifier le fichier .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚙️  Création du fichier .env...${NC}"
    cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://jus_user:jus_password_2026@localhost:5432/jus_db
ADMIN_API_KEY=admin_key_2026_jus_togo_secure
PORT=4000
EOF
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Démarrage des serveurs...${NC}"
echo ""

# Arrêter les anciens processus
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Démarrer le backend en arrière-plan
echo -e "${YELLOW}🔧 Backend : http://localhost:4000${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

# Vérifier que le backend tourne
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Erreur de démarrage du backend${NC}"
    echo "Consultez les logs : tail -f logs/backend.log"
    exit 1
fi

echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"

# Démarrer le frontend
echo -e "${YELLOW}🎨 Frontend : http://localhost:5173${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Application démarrée avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Accédez à l'application :"
echo "  🌐 Frontend : http://localhost:5173"
echo "  ⚙️  Backend  : http://localhost:4000"
echo "  👤 Admin    : http://localhost:5173/admin"
echo ""
echo "Logs :"
echo "  Backend : tail -f logs/backend.log"
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter${NC}"
echo ""

# Fonction de nettoyage
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des serveurs...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo -e "${GREEN}✅ Serveurs arrêtés${NC}"
    exit 0
}

# Capturer Ctrl+C
trap cleanup INT TERM

# Démarrer le frontend (bloquant)
cd frontend
npm run dev

# Si le frontend s'arrête, nettoyer
cleanup
