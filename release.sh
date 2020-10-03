#!/usr/bin/env bash
git checkout master
git pull
git merge dev
git push
git checkout dev