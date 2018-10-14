var fs = require('fs');

var fetch = require('node-fetch');
fetch(
   // 'http://cdn.taboola.com/libtrc/ume-technologies-browser-network/loader.js'
   // 'https://cdn.taboola.com/libtrc/ndtv/loader.js'
    'https://cdn.taboola.com/libtrc/ynet-ynet-/loader.js'
).then(res => res.text())
.then(body => analyze(body));


function stringify2(obj) {
  var placeholder = '____PLACEHOLDER____';
  var qte_placer = "@~@";
  var fns = [];
  var json = JSON.stringify(obj, function(key, value) {
    if (typeof value === 'function') {
      fns.push(value);
      return placeholder;
    }else if(typeof value === 'string' && value.indexOf("\"") > 0)
       value = value.replace(/\"/g,qte_placer);
    return value;
  });
  json = json.replace(new RegExp('"' + placeholder + '"', 'g'), function(_) {
    return fns.shift();
  });
  json = json.replace(new RegExp(qte_placer,'g'),"\\\"");
  return json;
}


function Clean(all,final)
{
    Object.keys(all).forEach(function(o){
       
        if( all[o].length == 1)
          all[o] = all[o][0].v;
        else
        {
          all[o].sort(function(o1,o2){return o2.c - o1.c;});
          if( final)
             all[o] = all[o][0].v; 
        }
    })
}


//process the file 
function analyze(text)
{
  var s = text.indexOf("var config={\"modes\"");
  var e = text.indexOf(",\"language\":");
  
  var x = text.substr(s,e-s);
  x+="}";
  



  eval(x);
  
  var compare = {};
  var allmodes = config.modes;
  var listOfmodes = Object.keys(allmodes).forEach(function(mode){
    debug("====== "+mode+" ========"); 
    Object.keys(allmodes[mode]).forEach(function(attr){
         debug("--> "+attr);
         if( !compare[attr])
         {
            compare[attr]={};
           compare[attr]=[{v:allmodes[mode][attr],c:1}];
           
         }
        else
           log(compare[attr],allmodes[mode][attr])
     });
  })

//Here we have all dupplication logging in allmode
   
  Clean(compare,true);
  console.log(JSON.stringify(compare,null,1));
   
  var newJS = buildJS(compare,config);//replace the new mode json inside the JS file
  var allfile = text.substr(0,s);
  var after = text.substr(e);
  allfile+=newJS+after;

  var ret = fs.writeFileSync("loader.js", text);
  var ret = fs.writeFileSync("loaderNew.js", allfile);

    console.log("The file was saved!",ret);
 
  
  //
  //console.log(ia.modes);
 
  
}

function clearQute(str)
{
  return str.replace(/\"/g,"\\\"");
}
  
function buildJS(common,all)
{
    var commonPrefix = "var base = ";
    var commonPosfix = ";function xx_ext(base,obj){ for(var k in obj)  { obj[k] = Object.assign({},base,obj[k])}; return obj;}";
    var propertylist = "";   
    
    /*var base = {
        prop1: value1
        ...
    };
    function xx_ext(base,obj){ for(var k in obj)  { obj[k] = Object.assign({},base,obj[k])}; return obj;}
    */  
    
    
    propertylist = stringify2(common);
     
     var mainListPrefix = "var la = { modes:xx_ext(base,";
     var mainListPosfix = ")";
     var main = {}; 
     for(var m in all.modes)
     {
        main[m] = {}; 
        for(var p in all.modes[m])
        {
            var candidate = all.modes[m][p];
            var baseProp = common[p];
            
            if( typeof candidate == 'function' && candidate.toString() != baseProp.toString() ||
                typeof candidate == 'object' && JSON.stringify(candidate) != JSON.stringify(baseProp) ||
                candidate != baseProp
               ) 
            {
               main[m][p] = candidate;
            }     
        }
     }
     var mainList = stringify2(main);

    /*
    var ia = { modes:xx_ext(base,{
   "place1":{a:3},
   "place2":{a:10,b:3}
    })
     ,"laguage":...};
    */ 

    var fullJS = commonPrefix + propertylist + commonPosfix + mainListPrefix + mainList + mainListPosfix;
    console.log(fullJS);
    
      
    eval(fullJS+"}");
    for(var m in all.modes)
    {
      console.log("---> ", m);
      for (var p in all.modes[m])
      {
        var orig = all.modes[m][p];
        var newObj = la.modes[m][p];
        if( typeof orig == "object")
        {
            if( JSON.stringify(orig) != JSON.stringify(newObj))
              console.log("Objets Err",p,orig,newObj);

        }else if( typeof orig == "function"){
          if( orig.toString() != newObj.toString() )
             console.log("Function Err",p,orig,newObj);
        }else if ( orig != newObj)
            console.log("General Err",p,orig,newObj);
        else 
           console.log("OK:",p);
      }
         
    }
    
    console.log("DONE")
    return fullJS;
}



function debug(txt)
{
  console.log.apply(console, arguments);
}


function UpdateOrAdd ( arr,value,newItem,isObject)
{
    var found =0;
     arr.forEach(function(o){
        if( isObject && JSON.stringify(o.v) == value)
        {
            found=1;
            o.c++;
        }
        else if( o.v == value )
        {
          found = 1;  
          o.c++;
        }
    });
    if( !found)
    {
        arr.push({v:newItem,c:1});
    }
}


function log(compareItem,newItem)
{
    var val = newItem;
    if( typeof newItem == 'function'  )
      val = newItem.toString();
   else if(  typeof newItem == "object" )
      val = JSON.stringify(newItem);
   
   UpdateOrAdd(compareItem,val,newItem,typeof newItem == "object");
  
        
 
}
















