# Desafio Devops

O projeto contém uma aplicação básica com Node, Ngnix e MySQL. 

A cada atualização da página, um novo registro será cadastrado no banco de dados e será mostrado na listagem, na mesma página.  

O projeto contém algumas falhas e erros, analise e implemente as devidas correções.

Se não entender algum conceito ou parte do problema, não é motivo para se preocupar! Queremos que faça o desafio até onde souber.

### O que deve ser feito? 
 1. Correção e Estabilização:
       - Faça a aplicação funcionar corretamente utilizando Docker Compose.
2. Melhoria de Containers
      - Otimize os Dockerfiles existentes.
3. Kubernetes
      - Crie manifests para rodar essa aplicação em Kubernetes.
4. CI/CD
      - Implemente um pipeline automatizado. (Build, Teste e Deploy)
5. Observabilidade
      - Implemente visibilidade básica da aplicação.
6. Troubleshooting 
      - Documente no README, problemas encontrados, como você identificou e como resolveu, a arquitetura da solução com decisões técnicas e melhorias realizadas e por fim o que você faria com mais tempo.

Faça um fork e realize commits ao longo do processo para que possamos entender o seu modo de pensar!


# Troubleshooting & Technical Decisions

Durante o desenvolvimento, containerização e implantação da aplicação, diversos desafios técnicos foram encontrados envolvendo Docker, Docker Compose, Kubernetes, Helm, gerenciamento de secrets e observabilidade.

Esta seção documenta os principais problemas encontrados, suas causas e as soluções aplicadas, além das decisões técnicas tomadas para melhorar segurança, estabilidade e manutenibilidade da solução.

---

# 🐳 Troubleshooting Docker Compose

Durante a primeira execução da stack utilizando Docker Compose, alguns erros e warnings foram identificados.

## Warning: atributo `version` obsoleto no Docker Compose

Ao executar:

```bash
docker-compose up
```

foi apresentado o seguinte warning:

```text
time="2026-07-14T15:54:30-03:00" level=warning msg="C:\Estudos\Kubernetes\desafio-devops\docker-compose.yaml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
```

### Causa

As versões atuais do Docker Compose não utilizam mais o atributo `version` no arquivo `docker-compose.yaml`.

### Solução aplicada

O atributo `version` foi removido do arquivo:

```yaml
version: "3.8"
```

Essa alteração evita warnings desnecessários e segue o padrão atual do Docker Compose Specification.

---

## Erro: Network não definida no Docker Compose

Após a remoção do `version`, outro erro foi identificado:

```text
service "nginx" refers to undefined network node-network: invalid compose project
```

### Causa

O serviço nginx estava utilizando uma rede customizada:

```yaml
networks:
  - node-network
```

Porém, essa rede não estava declarada no arquivo `docker-compose.yaml`.

### Solução aplicada

A rede foi adicionada explicitamente:

```yaml
networks:
  node-network:
    driver: bridge
```

Com isso, todos os serviços passaram a compartilhar corretamente a mesma rede interna.

---

# 🐳 Troubleshooting Dockerfiles

## Erro no update do apt

Durante o build da imagem Node, ocorreu falha ao instalar pacotes utilizando o gerenciador `apt`.

### Causa

A imagem inicialmente utilizada possuía uma versão antiga do Debian, onde alguns repositórios oficiais haviam sido descontinuados.

Como consequência, os pacotes não eram mais encontrados durante o processo:

```bash
apt-get update
```

### Solução aplicada

A versão base do Node foi atualizada para uma versão mais recente utilizando:

```dockerfile
FROM node:24-alpine
```

Essa alteração trouxe:

- Repositórios ativos.
- Menor tamanho da imagem.
- Melhor compatibilidade com bibliotecas atuais.

---

## Erro: Express module not found

Durante a execução da aplicação Node foi identificado:

```text
Error: Cannot find module 'express'
```

### Causa

As dependências da aplicação não estavam sendo instaladas corretamente durante o build da imagem.

### Solução aplicada

Foi adicionado o processo de instalação das dependências no Dockerfile:

```dockerfile
RUN npm install
```

Posteriormente, foi evoluído para:

```dockerfile
npm install --omit=dev --ignore-scripts && \
    npm cache clean --force
```

permitindo builds mais determinísticos e contendo somente dependências necessárias para produção.

---

## Erro de comunicação com banco de dados

A aplicação Node não conseguia conectar ao banco.

### Causa

O nome configurado na aplicação estava divergente do serviço definido no Docker Compose.

Aplicação:

```text
nodedb
```

Docker Compose:

```text
node_db
```

### Solução aplicada

O hostname utilizado pela aplicação foi corrigido para utilizar o nome real do serviço Docker:

```text
node_db
```

---

# 🚀 Melhorias aplicadas nos Dockerfiles

Além das correções de problemas, foram aplicadas melhorias seguindo boas práticas de construção de imagens.

---

## Multi-stage build

Foi implementado multi-stage build no Dockerfile do Node.

Antes:

```text
Código fonte
+
Dependências
+
Ferramentas de build
=
Imagem final
```

Depois:

```text
Builder Stage
        |
        v
Compilação e instalação

Runtime Stage
        |
        v
Somente aplicação necessária
```

Benefícios:

- Redução do tamanho final da imagem.
- Separação entre ambiente de build e execução.
- Menor superfície de ataque.

---

## Uso de imagens Alpine

As imagens foram alteradas para:

```dockerfile
node:24-alpine
nginx:1.25-alpine
```

Benefícios:

- Imagens menores.
- Menor consumo de armazenamento.
- Menor quantidade de pacotes instalados.

---

## Usuário não-root no container Node

Foi criado um usuário específico para execução da aplicação:

```dockerfile
USER nodejs
```

Essa alteração segue o princípio de:

> Least Privilege

Reduzindo impactos em caso de exploração da aplicação.

---

## Substituição do dockerize por Health Checks nativos

Inicialmente era utilizado `dockerize` para aguardar dependências.

Essa abordagem foi substituída pelos health checks nativos do Docker.

Benefícios:

- Menor dependência externa.
- Melhor integração com Docker Compose.
- Controle de estado mais confiável.

---

## Endpoint `/health`

Foi criado um endpoint específico:

```http
GET /health
```

Responsável por validar a saúde da aplicação.

Exemplo:

```json
{
  "status": "healthy"
}
```

Esse endpoint permite que Docker e Kubernetes monitorem a aplicação sem executar operações que possam impactar o banco de dados.

---

## Labels de rastreabilidade

Foram adicionados labels nos Dockerfiles:

```dockerfile
LABEL maintainer="..."
LABEL application="..."
LABEL version="..."
```

Objetivo:

- Melhor rastreabilidade das imagens.
- Facilitar gerenciamento em ambientes com múltiplas aplicações.

---

## Health Checks em todos os serviços

Foram implementados health checks para:

### MySQL

Utilizando:

```bash
mysqladmin ping
```

Validando disponibilidade do banco.

---

### Node.js

Validando:

```bash
GET /health
```

---

### Nginx

Utilizando:

```bash
wget
```

Para confirmar que o proxy está respondendo corretamente.

---

## Melhorias adicionais

Outras melhorias aplicadas:

- Remoção de volumes de desenvolvimento do Docker Compose.
- Ajuste do COPY do MySQL para copiar somente o arquivo necessário:

```text
init.sql
```

evitando arquivos desnecessários na imagem.

- Remoção de imagem nginx hardcoded no Docker Compose.

Antes:

```yaml
image: nginx:latest
```

Depois:

```yaml
build:
  context: ./nginx
```

Garantindo que sempre seja utilizada a imagem construída pelo projeto.

---

# 🔐 Migração do AWS Secrets Manager para Sealed Secrets

Inicialmente, a estratégia definida para gerenciamento de secrets utilizava:

```text
External Secrets Operator
            |
            v
AWS Secrets Manager
```

A proposta era manter os secrets armazenados na AWS e sincronizá-los automaticamente com o Kubernetes.

Porém, durante a implementação surgiram dificuldades relacionadas a:

- Configuração de permissões IAM.
- Autenticação entre Kubernetes e AWS.
- Comunicação com os recursos do Secrets Manager.
- Tempo disponível para investigação.

Devido ao prazo do desafio, foi realizada a migração para:

```text
Bitnami Sealed Secrets
```

---

## Fluxo final

```text
Secret
 |
 v
kubeseal
 |
 v
SealedSecret criptografado
 |
 v
Sealed Secrets Controller
 |
 v
Secret Kubernetes
```

Benefícios:

- Secrets podem ser versionados no Git de forma segura.
- Menor dependência externa.
- Ambiente mais fácil de reproduzir.
- Deploy simplificado.

---

# 📊 Implementação de Observabilidade com Prometheus

A aplicação inicialmente não possuía exposição de métricas.

Foi criada a rota:

```http
GET /metrics
```

utilizando a biblioteca Prometheus para Node.js.

A implementação foi realizada com auxílio de Inteligência Artificial para estruturar corretamente a instrumentação da aplicação.

Foram adicionadas métricas:

- Total de requisições HTTP.
- Tempo de resposta.
- Método HTTP.
- Status code das respostas.

Arquitetura:

```text
Node.js Application

        |
        v

/metrics

        |
        v

Prometheus

        |
        v

Grafana (Melhoria a implementar)
```

Essa implementação possibilitou integrar a aplicação ao stack de observabilidade Kubernetes.

---

# 🪟 Troubleshooting Helm em ambiente Windows

Durante o desenvolvimento utilizando Windows, foram encontrados problemas relacionados ao Helm e cache local.

Mesmo após remover recursos Kubernetes, alguns comandos retornavam:

```text
resource already exists
```

ou:

```text
namespace already exists
```

mesmo quando os recursos não estavam mais presentes.

---

## Causa

Foi identificado que o ambiente local mantinha informações antigas relacionadas aos releases Helm, causando divergência entre:

- Estado real do cluster.
- Estado armazenado pelo Helm.
- Cache local do Docker Desktop.

---

## Soluções aplicadas

Remoção dos releases:

```bash
helm uninstall <release>
```

Remoção de namespaces:

```bash
kubectl delete namespace <namespace>
```

Validação dos recursos:

```bash
kubectl get all -n <namespace>
```

Atualização dos charts:

```bash
helm repo update
```

Após a limpeza dos recursos órfãos, os deployments passaram a ocorrer normalmente.

---

# 🔄 Pipeline CI/CD

Para automatizar o processo de validação, construção e entrega da aplicação, foi implementada uma pipeline utilizando **GitHub Actions**, seguindo práticas de **CI/CD**, **Shift Left Security** e uma abordagem baseada em **GitOps**.

A pipeline foi estruturada para garantir que todo código entregue ao ambiente Kubernetes passe por etapas de validação, segurança, empacotamento e atualização automatizada dos manifestos de deploy.

---

# Arquitetura da Pipeline

O fluxo implementado segue o seguinte processo:

```text
Developer Commit / Manual Trigger
              |
              v
       GitHub Actions
              |
              |
    +---------+----------+
    |                    |
    v                    v
Build + Tests       Docker Build
Security Scan       Container Scan
    |                    |
    +---------+----------+
              |
              v
        Push AWS ECR
              |
              v
     Update Helm Values
              |
              v
      GitOps Repository
              |
              v
      Kubernetes Deploy
```

---

# Ambientes suportados

A pipeline foi preparada para trabalhar com múltiplos ambientes:

```text
development
staging
production
```

Cada ambiente possui suas próprias configurações através dos arquivos Helm Values:

```text
helm/
 └── desafio-devops/
      ├── values-development.yaml
      ├── values-staging.yaml
      └── values-production.yaml
```

Isso permite controlar configurações específicas de cada ambiente, como:

- Imagem utilizada.
- Recursos Kubernetes.
- Variáveis de ambiente.
- Configurações de aplicação.

---

# 🧪 Stage 1 - Build, Testes e Segurança

O primeiro estágio da pipeline é responsável por validar a aplicação antes da criação da imagem Docker.

Essa etapa executa:

- Instalação das dependências.
- Testes automatizados.
- Análise de qualidade de código.
- Scan de vulnerabilidades.

---

## Instalação das dependências

A pipeline realiza a instalação das dependências Node.js:

```bash
npm install
```

Garantindo que todas as bibliotecas necessárias estejam disponíveis para execução dos testes e validações.

---

## Testes automatizados

São executados testes unitários através do:

```bash
npm test
```

Caso algum teste falhe, a pipeline é interrompida e nenhuma imagem é publicada.

---

# 🔍 Code Quality

Para garantir qualidade e padronização do código, foram adicionadas ferramentas de análise estática.

## ESLint

Utilizado para identificar:

- Problemas de sintaxe.
- Possíveis bugs.
- Más práticas de desenvolvimento.

Execução:

```bash
npx eslint .
```

---

## Prettier

Responsável por validar o padrão de formatação do código:

```bash
npx prettier --check .
```

---

# 🛡️ Security Scan (Shift Left Security)

A pipeline implementa validações de segurança antes da entrega da aplicação.

O objetivo é identificar problemas ainda durante o processo de desenvolvimento.

---

## SCA - Dependency Scan

Foi utilizado o **Trivy** para análise das dependências da aplicação.

O scan verifica vulnerabilidades conhecidas em bibliotecas utilizadas pelo projeto.

Configuração:

```yaml
scan-type: fs
severity: CRITICAL
exit-code: 1
```

Caso sejam encontradas vulnerabilidades críticas, o pipeline falha.

---

## SAST - Static Application Security Testing

Foi utilizado o **Semgrep** para análise estática do código.

Essa etapa busca identificar:

- Vulnerabilidades de código.
- Padrões inseguros.
- Possíveis problemas de segurança.

---

# 🐳 Stage 2 - Docker Build

Após todas as validações de código, a aplicação é empacotada em uma imagem Docker.

A imagem é criada utilizando:

```bash
docker build
```

O nome da imagem segue o padrão:

```text
<service>:<environment>-<commit>
```

Exemplo:

```text
desafio-devops:production-a81bc92
```

Esse padrão permite:

- Rastreamento da versão implantada.
- Auditoria dos deploys.
- Facilidade de rollback.

---

# 🔐 Container Security Scan

Antes da publicação no registry, a imagem Docker passa por uma nova validação utilizando **Trivy**.

Esse processo analisa:

- Imagem base utilizada.
- Pacotes instalados.
- Dependências presentes no container.

Fluxo:

```text
Docker Image
      |
      v
Trivy Container Scan
      |
      |
 Vulnerabilidades críticas?
      |
 +----+----+
 |         |
Sim       Não
 |         |
Falha    Push ECR
Pipeline
```

---

# ☁️ Publicação no Amazon ECR

Após a aprovação dos testes e scans de segurança, a imagem é publicada no:

**Amazon Elastic Container Registry (ECR)**

Fluxo:

```text
Docker Image

      |
      v

AWS Authentication

      |
      v

Docker Tag

      |
      v

Push ECR
```

---

## Versionamento das imagens

As imagens são versionadas utilizando o hash do commit:

Exemplo:

```text
development-f82a91b
staging-c91bd23
production-a71ff90
```

Essa estratégia garante:

- Identificação exata do código executado.
- Histórico de versões.
- Facilidade para rollback.

---

# 🚀 Stage 3 - GitOps Deployment

Após o upload da imagem no ECR, a pipeline atualiza automaticamente os manifestos Helm.

A estratégia adotada segue o conceito GitOps:

```text
Pipeline CI/CD

      |
      v

Nova imagem Docker

      |
      v

Atualização values.yaml

      |
      v

Git Commit

      |
      v

ArgoCD sincroniza Kubernetes
```

---

## Atualização automática do Helm Values

A ferramenta `yq` é utilizada para alterar dinamicamente a imagem no arquivo:

```text
helm/desafio-devops/values-{environment}.yaml
```

Exemplo:

Antes:

```yaml
image:
  repository: old-image
```

Depois:

```yaml
image:
  repository: AWS_ECR/desafio-devops:production-a81bc92
```

---

## Commit automático

Após atualizar o manifesto, a pipeline realiza automaticamente:

```bash
git add
git commit
git push
```

Mantendo o histórico das alterações de infraestrutura no Git.

Exemplo de commit:

```text
Update desafio-devops image (production) to a81bc92
```

---

# 🔐 Secrets e Credenciais

As credenciais utilizadas pela pipeline são armazenadas utilizando:

- GitHub Actions Secrets.
- Environment Variables por ambiente.

São utilizadas para:

- Autenticação AWS.
- Push das imagens no ECR.
- Atualização dos manifestos.

Nenhuma credencial sensível é armazenada diretamente no código.

---

# 📋 Resumo das ferramentas utilizadas

| Categoria | Ferramenta |
|---|---|
| CI/CD | GitHub Actions |
| Runtime | Node.js |
| Containerização | Docker |
| Registry | Amazon ECR |
| SCA | Trivy |
| SAST | Semgrep |
| Code Quality | ESLint / Prettier |
| Deploy Strategy | GitOps |
| Manifest Management | Helm |
| Kubernetes Deployment | ArgoCD |

---

# ✅ Benefícios da Pipeline

A implementação garante:

✅ Validação automática do código  
✅ Testes antes da entrega  
✅ Análise de segurança integrada  
✅ Imagens Docker versionadas  
✅ Publicação automatizada no ECR  
✅ Atualização automática dos manifestos Kubernetes  
✅ Histórico completo de alterações via Git  
✅ Processo de deploy reproduzível e auditável  

A pipeline foi desenvolvida buscando aproximar o fluxo utilizado em ambientes corporativos, onde segurança, rastreabilidade e automação são requisitos essenciais para entrega contínua.

# ✅ Resultado Final

Ao final do desenvolvimento, a solução ficou com:

✅ Aplicação containerizada utilizando Docker  
✅ Imagens otimizadas com Alpine e multi-stage build  
✅ Containers executando com usuário não-root  
✅ Health checks implementados  
✅ Deploy Kubernetes utilizando Helm  
✅ Secrets protegidos com Sealed Secrets  
✅ Métricas expostas via Prometheus  
✅ Estrutura preparada para dashboards no Grafana  
✅ Ambiente reproduzível localmente  

As decisões tomadas buscaram equilibrar boas práticas de engenharia, segurança, tempo de implementação e facilidade de manutenção.