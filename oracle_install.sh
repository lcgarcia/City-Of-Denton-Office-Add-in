#!/bin/bash
cd linux_zips
unzip instantclient-basic-linux.x64-12.2.0.1.0.zip
unzip instantclient-sdk-linux.x64-12.2.0.1.0.zip
mv instantclient_12_2 instantclient
cb instantclient
ln -s libclntsh.so.12.1 libclntsh.so
ls -la 
ls -la linux_zips/instantclient
# Set oracle sdk in path
export LD_LIBRARY_PATH=$PWD:$LD_LIBRARY_PATH
export OCI_LIB_DIR=$PWD
export OCI_INC_DIR=$PWD/sdk/include
echo $OCI_LIB_DIR
echo $OCI_INC_DIR
cd ../..