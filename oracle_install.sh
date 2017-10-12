#!/bin/bash
unzip linux_zips/instantclient-basic-linux.x64-12.2.0.1.0.zip -d linux_zips
unzip linux_zips/instantclient-sdk-linux.x64-12.2.0.1.0.zip -d linux_zips
mv linux_zips/instantclient_12_2 linux_zips/instantclient
ln -s linux_zips/instantclient/libclntsh.so.12.1 linux_zips/instantclient/libclntsh.so
# Set oracle sdk in path
export LD_LIBRARY_PATH=$PWD/linux_zips/instantclient:$LD_LIBRARY_PATH
export OCI_LIB_DIR=$PWD/linux_zips/instantclient
export OCI_INC_DIR=$PWD/linux_zips/instantclient/sdk/include
echo $OCI_LIB_DIR
echo $OCI_INC_DIR