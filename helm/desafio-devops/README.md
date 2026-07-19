# Helm Chart - Desafio DevOps

Este Helm chart foi projetado para deploy da aplicação Node.js com MySQL e Nginx, utilizando Sealed Secrets para gerenciamento de secrets.

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
│   └── sealedsecret.yaml   # SealedSecret para credenciais
```

## Pré-requisitos

- Kubernetes cluster
- Helm 3.x
- Sealed Secrets Controller instalado
- kubeseal CLI instalado

## Configuração do Sealed Secrets

### 1. Instalar o Sealed Secrets Controller

```bash
# Via Helm
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets --namespace kube-system
```

### 2. Criar e Criptografar o Secret

```bash
# Criar um secret temporário com as credenciais
kubectl create secret generic db-credentials \
  --from-literal=MYSQL_HOST=mysql-service.desafio-devops.svc.cluster.local \
  --from-literal=MYSQL_USER=root \
  --from-literal=MYSQL_PASSWORD=your-password \
  --from-literal=MYSQL_DATABASE=node_db \
  --namespace desafio-devops \
  --dry-run=client -o yaml > secret.yaml

# Criptografar o secret usando kubeseal
kubeseal --format yaml --cert <(kubectl get secret -n kube-system sealed-secrets-key -o yaml) -f secret.yaml -w sealedsecret.yaml

# Copiar os valores criptografados para o arquivo values correspondente
# Exemplo: values-development.yaml ou values-prod.yaml
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
        - values-development.yaml
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
  -f helm/desafioDevops/values-development.yaml \
  --namespace desafioDevops-dev \
  --create-namespace

# Ambiente de produção
helm install desafioDevops ./helm/desafioDevops \
  -f helm/desafioDevops/values-production.yaml \
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
| `sealedSecret.enabled` | Habilitar SealedSecrets | `true` |
| `sealedSecret.name` | Nome do SealedSecret | `db-credentials` |
| `sealedSecret.namespace` | Namespace do SealedSecret | `desafio-devops` |
| `autoscaling.enabled` | Habilitar HPA | `true` |

## Sync Waves para ArgoCD

Os recursos são criados na seguinte ordem:

1. **Wave 0**: Namespace, SealedSecret
2. **Wave 2**: Deployment, Service, HPA, Ingress

## Segurança

- Secrets são criptografados usando Sealed Secrets e podem ser versionados no Git
- Sealed Secrets Controller descriptografa os secrets no cluster
- Apenas o cluster com a chave privada pode descriptografar os secrets
- Nenhuma dependência de serviços externos como AWS Secrets Manager
