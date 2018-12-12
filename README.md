# PAT. Backend (pat-project-backend)
Back End code for PAT.

### Frontend
Front-End Repo: https://github.com/joonasmkauppinen/pat-project-frontend

* __Latest features:__ [https://joonasmkauppinen.github.io/pat-project-frontend/](https://joonasmkauppinen.github.io/pat-project-frontend/)
* __"Official" site:__ [https://patapp.github.io](https://patapp.github.io)

## Installation & Usage

1. Clone or download this repository
```git clone https://github.com/joonasmkauppinen/pat-project-backend.git```
2. Install dependencies ```npm install```
3. Set up a Database Server, sql database structure found in file ```sql-database-structure.txt```
4. Rename ```.env.txt``` to be just ```.env``` 
5. Update the .env file _configuration_ (content)
6. Create following folders with sufficent permissions:
    * public
    * public/img
    * public/img/1px
    * public/img/thumb
    * public/img/usr
7. Run ```node server.js```

## Documentation

1. Run command ```apidoc -i api/ -o apidoc/``` in the project folder
2. Now API documentation is available in the folder ```apidoc/```
