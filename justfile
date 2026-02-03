# vi:ft=make

set shell := ["fish", "-c"]

default:
	just --list

db-create:
	sudo docker run --name exodus-ing-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 \
		-v exodus-volume:/var/lib/postgresql/18/docker -d postgres:18
db-destroy:
	docker stop exodus-ing-db
	docker rm exodus-ing-db
db-run:
	docker start exodus-ing-db
db-stop:
	docker stop exodus-ing-db
db-cli:
	pgcli $EXODUSING_DATABASE
