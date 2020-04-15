# install rabbitMQ on ubuntu
# full guide => https://www.rabbitmq.com/install-debian.html#apt

`sudo apt-get update`
`sudo apt-get upgrade`


## import PackageCloud signing key
`wget -O - "https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey" | sudo apt-key add -`


## Install prerequisites
sudo apt-get install curl gnupg -y


## Install RabbitMQ signing key
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc | sudo apt-key add -


## Install apt HTTPS transport
sudo apt-get install apt-transport-https




## Add Bintray repositories that provision latest RabbitMQ and Erlang 21.x releases
sudo tee /etc/apt/sources.list.d/bintray.rabbitmq.list <<EOF
## Installs the latest Erlang 22.x release.
## Change component to "erlang-21.x" to install the latest 21.x version.
## "bionic" as distribution name should work for any later Ubuntu or Debian release.
## See the release to distribution mapping table in RabbitMQ doc guides to learn more.
deb https://dl.bintray.com/rabbitmq-erlang/debian bionic erlang
deb https://dl.bintray.com/rabbitmq/debian bionic main
EOF


## Update package indices
sudo apt-get update -y



## Install rabbitmq-server and its dependencies
sudo apt-get install rabbitmq-server -y --fix-missing

##enable dashboard
sudo rabbitmq-plugins enable rabbitmq_management


## To start the service:
service rabbitmq-server start



## open dashboard
http://localhost:15672/

user: guest
pass: guest






------------------------------------------------------------
# csv
cp ./receiver.js /var/www/csv

add execute permission to receiver.js
 sudo chmod +x receiver.js

 
Copy your service file into the /etc/systemd/system.

Start it with systemctl start myapp.

