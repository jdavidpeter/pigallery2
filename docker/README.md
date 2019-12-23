# PiGallery2 docker installation [![Docker build](https://github.com/bpatrik/pigallery2/workflows/docker-buildx/badge.svg)](https://github.com/bpatrik/pigallery2/actions)

You can use [docker](https://docs.docker.com/install/) to run PiGallery2. See all available docker tags here: https://hub.docker.com/r/bpatrik/pigallery2/tags/
We support multiple architectures, including `amd64`, `arm32v7`, `arm64v8`.


## 0. Install docker
Official installation guide [here](https://docs.docker.com/install/),
but this will most likely do the trick ([source](https://dev.to/rohansawant/installing-docker-and-docker-compose-on-the-raspberry-pi-in-5-simple-steps-3mgl)): 
```bash
curl -sSL https://get.docker.com | sh
``` 

## I. Docker compose
It is recommended to use [docker-compose](https://docs.docker.com/compose/) to run pigallery2.

### I.0 Install docker-compose
Official dokcer-compose installation guide [here](https://docs.docker.com/compose/install/),
but this will  most likely  do the trick ([source](https://dev.to/rohansawant/installing-docker-and-docker-compose-on-the-raspberry-pi-in-5-simple-steps-3mgl)): 
Install dependencies:
```bash
sudo apt-get install libffi-dev libssl-dev
sudo apt-get install -y python python-pip
sudo apt-get remove python-configparser
```
Install docker-compose:
```bash
sudo pip install docker-compose
``` 
You can check if it was successful with `docker-compose --version`.

### I.1 get docker-compose.yml file
Download [docker-compose/default/docker-compose.yml](docker-compose/default/docker-compose.yml) and 
[docker-compose/default/nginx.conf](docker-compose/default/nginx.conf).

Edit `docker-compose.yml` to point the volumes to the right `image` and `tmp` directories.
Edit `nginx.conf` by replacing `yourdomain.com` to you domain address.

**Note:** We are using nginx as reverse proxy to handle https and do proper HTTP queuing, gzipping, etc. Full nginx-based docker-compose tutorial [here](https://www.domysee.com/blogposts/reverse-proxy-nginx-docker-compose).

**Note 2:** You can skip nginx, by using [docker-compose/pigallery2-only/docker-compose.yml](docker-compose/pigallery2-only/docker-compose.yml).

#### I.1.a get SSL certificate with certbot
Install certbot: https://certbot.eff.org/. (Certbot uses letsencrypt to get free certificate).
Than get your certificate: 
```bash
certbot certonly --standalone -d yourdomain.com
```

#### I.1.a start docker-compose
In the folder that has `docker-compose.yml`:
```bash
docker-compose up -d
```
`-d` runs it as a daemon. Remove it, so you will see the logs. 

After the containers are up and running, you go to `yourdomain.com` and log in with user: `admin` pass: `admin` and set up the page in the settings. 

**Note:** `docker-compose.yml` contains `restart:always`, so the containers will be automatically started after reboot ([read more here](https://stackoverflow.com/questions/43671482/how-to-run-docker-compose-up-d-at-system-start-up)).


## II. Without docker-compose
If you want to run the container by yourself, here you go:

```bash
docker run \
   -p 80:80 \
   -e NODE_ENV=production \
   -v <path to your config file folder>/config.json:/app/data/config/config.json \
   -v <path to your db file folder>:/app/data/db \
   -v <path to your images folder>:/app/data/images \
   -v <path to your temp folder>:/app/data/tmp \
   bpatrik/pigallery2:nightly-stretch
```

After the container is up and running, you go to `http://localhost` and log in with user: `admin` pass: `admin` and set up the page in the settings. 

**Note**: even with `memory` db, pigallery2 creates a db file for storing user credentials (if enabled), so mounting (with `-v`) the `/app/data/db` folder is recommended.

### II.a before v1.7.0
There was a breaking change in Docker files after v1.7.0. Use this to run earlier versions:

```bash
docker run \
   -p 80:80 \
   -e NODE_ENV=production \
   -v <path to your config file folder>/config.json:/pigallery2-release/config.json \
   -v <path to your db file folder>/sqlite.db:/pigallery2-release/sqlite.db \
   -v <path to your images folder>:/pigallery2-release/demo/images \
   -v <path to your temp folder>:/pigallery2-release/demo/TEMP \
   bpatrik/pigallery2:1.7.0-stretch
```
Make sure that a file at `<path to your config file folder>/config.json` and `sqlite.db` files exists before running it. 

You do not need the `<path to your db file folder>/sqlite.db` line if you don't use the sqlite database.

 
## Build the Docker image on your own
 
You can clone the repository and build the image, or you can just use the 'self-contained' Dockerfile: [debian-stretch/selfcontained/Dockerfile](debian-stretch/selfcontained/Dockerfile)

