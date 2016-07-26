    goog.provide('ParserCornerstone.dumpFileWithoutReader');

    goog.require('ParserCornerstone.dicomParser');

    function dumpFile(file)
    {

        var reader = new FileReader();
        reader.onload = function(file) {
            var arrayBuffer = reader.result;

            // Here we have the file data as an ArrayBuffer.  dicomParser requires as input a
            // Uint8Array so we create that here
            var byteArray = new Uint8Array(arrayBuffer);

            var kb = byteArray.length / 1024;
            var mb = kb / 1024;
            var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";

            setTimeout(function() {
            var dataSet;

            dataSet = dicomParser.parseDicom(byteArray);

            return dataSet;
            /*var attr = "x00280010";
            var element = dataSet.elements[attr];
            var text ="";
            if(element !== undefined){
                var str = dataSet.string(attr);
                if(str !== undefined){
                    text = str;
                    console.log("ici");
                }
            }

            console.log(dataSet.uint16(attr));
            var cont = document.getElementById("container1");
            cont.innerHTML = text + "   voila";*/
        }, 300);

        };

        reader.readAsArrayBuffer(file);
    }


    function dumpFileWithoutReader(resultread)
    {

        var arrayBuffer = resultread;

        var byteArray = new Uint8Array(arrayBuffer);

        var kb = byteArray.length / 1024;
        var mb = kb / 1024;
        var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";

        var dataSet;

        dataSet = dicomParser.parseDicom(byteArray);

        return dataSet;
            /*var attr = "x00280010";
            var element = dataSet.elements[attr];
            var text ="";
            if(element !== undefined){
                var str = dataSet.string(attr);
                if(str !== undefined){
                    text = str;
                    console.log("ici");
                }
            }

            console.log(dataSet.uint16(attr));
            var cont = document.getElementById("container1");
            cont.innerHTML = text + "   voila";*/
    }