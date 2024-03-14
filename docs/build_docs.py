import json
import os
import subprocess

# adapted from https://www.codingwiththomas.com/blog/my-sphinx-best-practice-for-a-multiversion-documentation-in-different-languages

# a single build step, which keeps conf.py and versions.yaml at the main branch
# in generall we use environment variables to pass values to conf.py, see below
# and runs the build as we did locally
def build_doc(tag):
    os.environ["current_version"] = tag
    subprocess.run("git checkout " + tag, shell=True)
    subprocess.run("git checkout main -- source/conf.py", shell=True)
    subprocess.run("git checkout main -- tags.json", shell=True)
    subprocess.run("make html", shell=True)

# a move dir method because we run multiple builds and bring the html folders to a
# location which we then push to github pages
def move_dir(src, dst):
  subprocess.run(["mkdir", "-p", dst])
  subprocess.run(f"mv {src}* {dst}", shell=True)

# to separate a single local build from all builds we have a flag, see conf.py
os.environ["build_all_docs"] = str(True)
os.environ["pages_root"] = "https://Battery-Intelligence-Lab.github.io/galv-backend"

# manually the main branch build in the current supported languages
build_doc("main")
move_dir("./build/html/", "../pages/")

tags = json.load(open("tags.json", "r"))

# and looping over all values to call our build with version, language and its tag
for tag in tags:
    build_doc(tag)
    move_dir("./build/html/", f"../pages/{tag}/")
