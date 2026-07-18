# Helm Chart - Desafio DevOps

Este Helm chart foi projetado para deploy da aplicação Node.js com MySQL e Nginx, utilizando External Secrets Operator para gerenciamento de secrets.

## Estrutura

```
helm/desafioDevops/
├── Chart.yaml
├── values.yaml              # Valores padrão
├── values-dev.yaml          # Ambiente de desenvolvimento
├── values-prod.yaml         # Ambiente de produção
├── templates/
│   ├── _helpers.tpl         # Template helpers
│   ├── namespace.yaml       # Criação de namespace
│   ├── deployment.yaml      # Deployment da aplicação
│   ├── service.yaml         # Service
│   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   ├── ingress.yaml        # Ingress
│   ├── external-secret.yaml # ExternalSecret para credenciais
│   └── secret-store.yaml    # SecretStore para AWS Secrets Manager
```

## Pré-requisitos

- Kubernetes cluster
- Helm 3.x
- External Secrets Operator instalado
- AWS Secrets Manager configurado (ou Vault)

## Configuração do External Secrets Operator

Opção 2: External Secrets Operator com AWS Secrets Manager

### 1. Criar secrets no AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name desafioDevops/host \
  --secret-string "mysql-service.desafioDevops.svc.cluster.local"

aws secretsmanager create-secret \
  --name desafioDevops/user \
  --secret-string "root"

aws secretsmanager create-secret \
  --name desafioDevops/password \
  --secret-string "your-password"

aws secretsmanager create-secret \
  --name desafioDevops/database \
  --secret-string "node_db"
```

### 2. Criar IAM Role para External Secrets

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: desafioDevops
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/ExternalSecretsRole
```

### 3. Configurar ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: desafioDevops-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/ThiagoLemoos/desafioDevops.git
    targetRevision: main
    path: helm/desafioDevops
    helm:
      valueFiles:
        - values-dev.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: desafioDevops-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## Deploy Local com Helm

```bash
# Ambiente de desenvolvimento
helm install desafioDevops ./helm/desafioDevops \
  -f helm/desafioDevops/values-dev.yaml \
  --namespace desafioDevops-dev \
  --create-namespace

# Ambiente de produção
helm install desafioDevops ./helm/desafioDevops \
  -f helm/desafioDevops/values-prod.yaml \
  --namespace desafioDevops-prod \
  --create-namespace
```

## Valores Configuráveis

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `desafioDevops.replicas` | Número de réplicas | `1` |
| `desafioDevops.namespace` | Namespace | `desafioDevops` |
| `desafioDevops.image` | Imagem da aplicação | `ECR image` |
| `desafioDevops.port` | Porta da aplicação | `3000` |
| `externalSecret.enabled` | Habilitar External Secrets | `true` |
| `externalSecret.refreshInterval` | Intervalo de refresh | `1h` |
| `secretStore.provider` | Provider (aws/vault) | `aws` |
| `autoscaling.enabled` | Habilitar HPA | `true` |

## Sync Waves para ArgoCD

Os recursos são criados na seguinte ordem:

1. **Wave 0**: Namespace, SecretStore
2. **Wave 1**: ExternalSecret
3. **Wave 2**: Deployment, Service, HPA, Ingress

## Segurança

- Secrets são armazenados no AWS Secrets Manager
- External Secrets Operator sincroniza secrets com Kubernetes
- Secrets não são versionados no Git
- IRSA (IAM Roles for Service Accounts) para autenticação AWS
