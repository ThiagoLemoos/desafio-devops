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
