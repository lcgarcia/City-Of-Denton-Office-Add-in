#!/bin/bash

cd linux_zips
unzip instantclient-basic-linux.x64-12.2.0.1.0.zip
unzip instantclient-sdk-linux.x64-12.2.0.1.0.zip
mv instantclient_12_2 instantclient
cd instantclient
cp libclntsh.so.12.1 libclntsh.so
