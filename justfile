# vi:ft=make

set shell := ["fish", "-c"]

default:
	just --list

sqlite:
	@litecli -R 'local> ' (fd '.sqlite$' .wrangler)
