# Documentation de Déploiement - DONA.club

## 🚀 Déploiement rapide

### Prérequis
- Node.js 20+
- npm 10+
- Accès FTP OVH
- Variables d'environnement configurées

### Build et déploiement

```bash
# 1. Build de production
npm run build

# 2. Vérifier le build
ls -lah dist/

# 3. Déployer via FTP
# Utiliser FileZilla ou le workflow GitHub Actions
```

## 🔧 Configuration

### Variables d'environnement (.env.production)
```env
VITE_SUPABASE_URL=https://scnaqjixwuqakppnahfg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://visualiser.dona.club
```

### Identifiants FTP OVH
- Serveur: ftp.cluster0XX.hosting.ovh.net
- Utilisateur: [voir Manager OVH]
- Dossier: /www/

## 🐛 Dépannage

### Erreur 404 sur refresh
→ Vérifier que `.htaccess` est présent dans `/www/`

### Erreur CORS
→ Vérifier la configuration Supabase (Allowed origins)

### Erreur SSL
→ Vérifier le certificat Let's Encrypt dans Manager OVH

## 📞 Support
- OVH: https://www.ovh.com/manager/
- Supabase: https://supabase.com/dashboard
- GitHub: https://github.com/DONA.club/visualiser