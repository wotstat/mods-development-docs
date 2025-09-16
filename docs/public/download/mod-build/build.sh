#!/bin/bash

# Настройки
MOD_NAME="my.first-mod"
MOD_ENTRY=mod_myFirstMod.py


# Чтение версии
while getopts "v:" flag
do
    case "${flag}" in
        v) v=${OPTARG};;
    esac
done

if [ -z "$v" ]; then
    echo "Version not specified. Use -v x.y.z"
    exit 1
fi


# Подготовка сборки
rm -rf ./build
mkdir ./build
cp -r ./res ./build


# Установка версии
configPath="./build/res/scripts/client/gui/mods/$MOD_ENTRY"
perl -i -pe "s/{{VERSION}}/$v/g" "$configPath"

# Компиляция Python
python2 -m compileall ./build

# Компиляция AS3
if [ -e "./as3/build.sh" ]; then
    cd ./as3
    rm ./bin/*.swf
    ./build.sh
    cd ../

    mkdir -p ./build/res/gui/flash
    find ./as3/bin -name "*.swf" -exec cp {} ./build/res/gui/flash/ \;
fi

# Установка meta.xml
meta=$(<meta.xml)
meta="${meta/\{\{VERSION\}\}/$v}"

cd ./build
echo "$meta" > ./meta.xml

# Сборка архива
folder=$MOD_NAME"_$v.mtmod"

rm -rf $folder


zip_maybe() {
  local archive="$1"; shift
  zip -qr -0 -X "$archive" "$@" 2>/dev/null || {
    code=$?
    [ "$code" -eq 12 ] || return "$code"
  }
}

zip_maybe "$folder" meta.xml res -i '*.pyc' '*.swf' '*.png'
zip -qr -0 -X "$folder" meta.xml 

cd ../
cp ./build/$folder $folder
rm -rf ./build

echo "Build complete: $folder"