#!/bin/bash

unzip lib.zip

DEPS="/home/vcap/app/libaio"
unzip libaio.zip
cd libaio
make prefix=$DEPS install