#!/usr/bin/env bash

if [[ "$(uname)" == 'Darwin' ]]; then
    readonly ROOT="$(dirname $(dirname $(realpath $0)))"
else
    readonly ROOT="$(dirname $(dirname $(readlink -f $0)))"
fi

build() {
    cd $ROOT && npm run build
    cd "${ROOT}/cmd-tools" && npm run build
}

lint() {
    cd $ROOT && npm run lint
    cd "${ROOT}/cmd-tools" && npm run lint
}

main() {
    case $1 in
	all)
	    lint
	    build
	    ;;
	build)
	    build
	    ;;
	lint)
	    lint
	    ;;
	*)
	    ;;
    esac
}

# main
main $@
