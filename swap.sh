#!/usr/bin/env bash

readonly TARGET=$2
readonly CONFIG="./config/default.json"
readonly CONFIG_BAK="./config/.default.json"

dev() {
    echo "[ info ]: change to dev mode...";
    if [[ ! -e $TARGET ]];
    then
	echo "[ error ]: target config doesn't exist"
	help
	return;
    fi
       
    cp $CONFIG $CONFIG_BAK
    cp $TARGET $CONFIG

    echo 'ok!'
}

pub() {
    echo "[ info ]: change to public mode...";
    if [[ ! -e $CONFIG_BAK ]];
    then
	echo "error: config backup doesn't exist"
	reset
	return;
    fi
    
    cp ./config/default.json.bak ./config/default.json

    echo 'ok!'
}

reset() {
    echo '[ question ] reset config? [y/n]'
    read ans
    
    if [[ $ans != 'y' ]];
    then
	exit 0
    fi
    
    echo '{
    "WEB3_RPC_SERVER": "",
    "INFURA_KEYS": [],
    "DARWINIA_RPC_SERVER": "",
    "KEYRING": "",
    "SEED": ""
}' > $CONFIG

    echo 'ok!'
}

help() {
    cat <<EOF
Usage: swap <COMMAND> <FILE>

COMMANDS:
    dev      dev mode
    pub      pub mode
    reset    reset config

EXAMPLES:
    # use clearloop.json as current config
    ./swap.sh dev ./config/clearloop.json 

    # convert to publish mode
    ./swap.sh pub
    
    # reset config
    ./swap.sh reset
EOF
}

main() {
    case $1 in
	dev)
	    dev
	    ;;
	pub)
	    pub
	    ;;
	reset)
	    reset
	    ;;
	*)
	    help
	    echo $TARGET
	    ;;
    esac
}


# main
main $@
