#!/bin/bash
cd linux_zips
unzip instantclient-basic-linux.x64-12.2.0.1.0.zip
unzip instantclient-sdk-linux.x64-12.2.0.1.0.zip
mv instantclient_12_2 instantclient
cd instantclient
cp libclntsh.so.12.1 libclntsh.so
# ln -s libclntsh.so.12.1 libclntsh.so

# Set oracle sdk in path
export LD_LIBRARY_PATH=$PWD:$LD_LIBRARY_PATH
export OCI_LIB_DIR=$PWD
export OCI_INC_DIR=$PWD/sdk/include
echo $OCI_LIB_DIR
echo $OCI_INC_DIR
ls -la 
cd ../..
# source pathvars.sh