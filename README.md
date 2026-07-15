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

Faça um fork e realize commits ao longo do processo para que possamos entender o seu modo de pensar! :)
 
  
Troubleshooting:
Tomei o seguinte warning/erro após rodar o docker-compose:
```
-> docker-compose up
time="2026-07-14T15:54:30-03:00" level=warning msg="C:\\Estudos\\Kubernetes\\desafio-devops\\docker-compose.yaml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
service "nginx" refers to undefined network node-network: invalid compose project
```

Warning Version:
- Removido o atributo `version` do docker-compose.yaml para evitar o warning.

Erro Network:
- Adicionado a definição de rede `node-network` no docker-compose.yaml para evitar o erro.

Erro no update do apt:
- Bibliotecas debian não estavam sendo encontradas pois na versão 15 do node os repositorios foram descontinuados, alterado para 22 para resolver.

Erro Express not found:
- Adicionado o comando `npm install` no Dockerfile do node para instalar as dependências do express.

Erro comunicação com o banco:
- Corrigido o nome do banco que antes estava nodedb apontado no node, porém no docker-compose é node_db.

Melhorias nos Dockerfiles:
- Implementado multi-stage build no node/Dockerfile para reduzir tamanho da imagem final e separar dependências de build de runtime.
- Alterado para imagens Alpine (node:22-alpine, nginx:1.25-alpine) para reduzir significativamente o tamanho das imagens.
- Adicionado usuário não-root no container Node para melhorar segurança seguindo princípios de least privilege.
- Substituído dockerize por health checks nativos do Docker para gerenciar dependências entre serviços de forma mais robusta.
- Adicionado endpoint /health na aplicação para permitir health checks específicos sem efeitos colaterais no banco.
- Adicionado labels de metadados em todos os Dockerfiles para melhor rastreabilidade e gestão de imagens.
- Implementado health checks em todos os serviços (MySQL, Node, Nginx) para monitoramento automático da saúde dos containers.
- Utilizado npm ci --only=production no Node para builds determinísticos e apenas dependências de produção.
- Removido volume de desenvolvimento do docker-compose para tornar a configuração mais adequada para produção.
- Corrigido COPY específico no MySQL para copiar apenas o init.sql necessário, evitando arquivos desnecessários.
- Definido health check no MySQL usando mysqladmin ping para verificar disponibilidade do banco.
- Adicionado health check no Nginx usando wget para verificar se o proxy está respondendo corretamente.
- Removida imagem hardcoded do nginx no docker-compose para usar sempre a imagem buildada localmente.
