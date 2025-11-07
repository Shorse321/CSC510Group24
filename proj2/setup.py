import os
from setuptools import setup, find_packages

setup(
    name="stackshackpack",
    version="1.3",
    author="Swetha Manivasagam",
    author_email="smaniva4@ncsu.edu",
    description="A Flask MySQL application package",
    long_description=open('README.md').read() if os.path.exists('README.md') else "",
    long_description_content_type="text/markdown",
    url="https://github.com/Shorse321/CSC510Group24",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.7',
    install_requires=[
        'flask',
        'mysql-connector-python',
    ],
)
