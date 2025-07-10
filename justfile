# vi:ft=make

set shell := ["fish", "-c"]

default:
	just --list

sqlite:
	@litecli -R 'local> ' (fd '.sqlite$' .wrangler)

db-create:
	docker run --name exodus-ing-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 \
		-e PGDATA=/var/lib/postgresql/17/docker \
		-v $PWD/.direnv/pgdata:/var/lib/postgresql/17/docker -d postgres:17
db-run:
	docker start exodus-ing-db
db-stop:
	docker stop exodus-ing-db
db-cli:
	pgcli $EXODUSING_DATABASE
