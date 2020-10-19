#!/usr/bin/env bash
git checkout master
git pull
git merge dev --squash -m "Merge dev to master"
git push
git checkout dev