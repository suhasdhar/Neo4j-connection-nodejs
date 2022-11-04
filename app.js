var express= require('express');
var path= require('path');
var bp=require('body-parser');
var app= express();
var neo4j= require('neo4j-driver');
const { Console } = require('console');
app.use(bp.json());
app.listen(3000);
console.log('Server Started');

module.exports = app;
var driver = neo4j.driver('bolt://localhost:7687',neo4j.auth.basic('neo4j','Rajul123.'));
var session = driver.session();

// this block of code adds a new movie node to the DB
app.get('/',function(req,res){
console.log(req.body);
bod=req.body
session.run('CREATE (a:Movie {name: $name, show_id :$show_id, type:$type, title:$title, release_year:$release_year, rating:$rating, duration: $duration, description :$description  })', 
{ name: bod.name,show_id: bod.show_id, type: bod.type, title: bod.title, release_year:bod.release_year, rating:bod.rating, duration:bod.duration, description :bod.description  })
.then(function (result) {
    console.log(result);
  })

res.send("node added!");

});

// this block of code updates an already existing node
app.patch("/title/:name",function(req,res){
    var name = req.params['name'];
    bod=req.body
 
    session.run('MATCH (movie:Movie) where movie.title=$title set movie+= { description :$description , rating :$rating} return movie', { title:name, rating:bod.rating, description:bod.description })
    .then(function (result) {
        console.log(result);
      })

res.send("node updated");

});

//this block of code deletes an already existing node
app.delete("/title/:name",function(req,res){
    var name = req.params['name'];
    session.run('MATCH (movie:Movie) where movie.title=$title detach delete movie', { title:name })
       .then(function (result) {
            console.log(result);
        })
       .catch(function (error) {
        console.log(error);
  });
  res.send("deleted");

});

// this block of code returns all movies as a response 

app.get('/title', async function(req,res){
  
    var movies=[];
    await session
    .run("MATCH (movie:Movie)  RETURN movie")
        .then(function (result) {
       
            result.records.forEach((rec)=>{
             let obj=rec._fields[0].properties
             //console.log(obj)
             let clone = JSON.parse(JSON.stringify(obj));
             movies.push(clone);

            })              
       
       
        })
        .catch(function (error) {
          console.log(error);
})

   console.log(movies)
   res.send(movies);
    
    });

// block of code which takes movie title as parameters and returns all information about the movie;

    app.get('/title/:name',async function(req,res){
        var directors=new Set();
        var actors=new Set();
        var ret=[];
        var name = req.params['name'];
        await session.run( 'MATCH (actor)-[ACTED_IN]->(m:Movie{title:$name})<-[r:DIRECTED_IN]-(director) RETURN m,director,actor',{name:name})
        .then(function (result) {

          let obj, obj2, obj3
            result.records.forEach((rec)=>{
             obj=rec._fields[0].properties
             obj2=rec._fields[1].properties
             directors.add(obj2.name);
             obj3=rec._fields[2].properties
             actors.add(obj3.name);

            })    
            ret.push(obj);
            ret.push({"Actors":obj2.name});
            ret.push({"Directors":obj3});

       console.log()
       console.log("Movie name: "+name )     
       console.log()         
       console.log("Actors: ");
       actors.forEach((act)=>{console.log(act)})
       console.log()
       console.log("Directors:");
       directors.forEach((dir)=>{  console.log(dir)})
       console.log("***********************")
       
        })
        .catch(function (error) {
          console.log(error);
        })
   
         res.send(ret)

    });