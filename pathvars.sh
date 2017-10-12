#!/bin/bash

export LD_LIBRARY_PATH=$PWD/linux_zips/instantclient:$LD_LIBRARY_PATH
export OCI_LIB_DIR=$PWD/linux_zips/instantclient
export OCI_INC_DIR=$PWD/linux_zips/instantclient/sdk/include
echo $OCI_LIB_DIR
echo $OCI_INC_DIR
