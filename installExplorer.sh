
#!/bin/bash

# install needed dependencies
cd
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
sudo apt-get install -y libzmq3-dev

# MongoDB
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.1 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.1.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod
sudo service mongod start

# Flux
echo 'deb https://apt.runonflux.io/ '$(lsb_release -cs)' main' | sudo tee --append /etc/apt/sources.list.d/flux.list
gpg --keyserver keyserver.ubuntu.com --recv 4B69CA27A986265D
gpg --export 4B69CA27A986265D | sudo apt-key add -
sudo apt-get update
sudo apt-get install flux

#bitcore-node
cd
git clone https://github.com/runonflux/bitcore-node
cd bitcore-node
npm install
cd bin
chmod +x bitcore-node
./bitcore-node create mynode
cd mynode

rm bitcore-node.json

cat << EOF > bitcore-node.json
{
  "network": "livenet",
  "port": 3001,
  "services": [
    "bitcoind",
    "insight-api",
    "insight-ui",
    "web"
  ],
  "messageLog": "",
  "servicesConfig": {
      "web": {
      "disablePolling": false,
      "enableSocketRPC": false
    },
    "bitcoind": {
      "sendTxLog": "./data/pushtx.log",
      "spawn": {
        "datadir": "./data",
        "exec": "fluxd",
        "rpcqueue": 1000,
        "rpcport": 16124,
        "zmqpubrawtx": "tcp://127.0.0.1:28332",
        "zmqpubhashblock": "tcp://127.0.0.1:28332"
      }
    },
    "insight-api": {
        "routePrefix": "api",
                 "db": {
                   "host": "127.0.0.1",
                   "port": "27017",
                   "database": "flux-api-livenet",
                   "user": "",
                   "password": ""
          },
          "disableRateLimiter": true
    },
    "insight-ui": {
        "apiPrefix": "api",
        "routePrefix": ""
    }
  }
}
EOF

cd data
cat << EOF > flux.conf
server=1
whitelist=127.0.0.1
txindex=1
addressindex=1
timestampindex=1
spentindex=1
insightexplorer=1
experimentalfeatures=1
zmqpubrawtx=tcp://127.0.0.1:28332
zmqpubhashblock=tcp://127.0.0.1:28332
rpcport=16124
rpcallowip=127.0.0.1
rpcuser=flux
rpcpassword=myfluxpassword
uacomment=bitcore
mempoolexpiry=24
rpcworkqueue=1100
maxmempool=2000
dbcache=1000
maxtxfee=1.0
dbmaxfilesize=64
showmetrics=0
maxconnections=100000
addnode=explorer.runonflux.io
addnode=explorer.flux.zelcore.io
EOF

cd ..
cd node_modules
git clone https://github.com/runonflux/insight-api
git clone https://github.com/runonflux/insight-ui
cd insight-api
npm install
cd ..
cd insight-ui
npm install
cd ..
cd ..

echo "Explorer is installed"
echo "Then to start explorer navigate to mynode folder and type ../bitcore-node start. Explorer will be accessible on localhost:3001" 
