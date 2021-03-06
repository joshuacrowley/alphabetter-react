Meteor.methods({

  findGame : function(){
    var games = Games.findOne({finished: false});
    if (games != undefined){
      return games.gameToken;
    }else{
      var token = startGame();
      console.log(token);
      return token;
    };
  },

  addName : function(gameToken, playerToken, name){
    if(name !== ""){
      console.log('whats happening ' + gameToken + " " + playerToken + " " + name);
    Games.update({"gameToken" : gameToken, "player.playerToken" : playerToken}, 
        {$set : { "player.$.playerHandle" : name}}, 
        function(){return "player " + playerToken + " is now " + name + "."});
    }else{
      return "Please enter a name";
    }
  },

  shuffleBoard : function(gameToken){

    var sequence = Boxes.find({"gameToken" : gameToken},{sort : { boxOrder : 1}}).fetch();
    var n = 10;

    var rows = _.groupBy(sequence, function(element, index){
        return Math.floor(index/n);
    });

    rows = _.shuffle(rows);
    sequence = _.flatten(rows);

    var columns = _.groupBy(sequence, function(element, index){
      return index%n;
    });

    columns = _.shuffle(columns);
    fixedSequence = _.flatten(columns);

    var i = 0;

    fixedSequence.forEach(function (box) {
      Boxes.update({_id : box._id}, {$set : {"boxOrder" : i++,}});
      console.log(box.boxOrder);
    });

  },

  updateScore : function(gameId, playerToken, amount){

    var player = Games.findOne({_id : gameId}).player;
    player = _.filter(player, function(player) { return player.playerToken === playerToken });

    if ((player[0].playerScore + amount) > 0 ){

    Games.update({_id : gameId, "player.playerToken" : playerToken}, 
        {$inc : { "player.$.playerScore" : amount}}, 
        function(){console.log("player " + playerToken + " score is " + gameId + ".")});

    }else if((player[0].playerScore + amount) <= 0){

      Games.update({_id : gameId, "player.playerToken" : playerToken}, 
        {$set : { "player.$.playerScore" : 0}}, 
        function(){console.log("player " + playerToken + " score is " + gameId + ".")});

    };

  },

  addOpponent : function (gameToken, playerToken){

    var game = Games.findOne({gameToken : gameToken});

    Games.update(
    {_id: game._id, 'player.playerToken': {$ne: playerToken}}, 
    {$push: {player: {'playerToken': playerToken, 'playerScore': 0, "playerHandle" : "Player " +game.player.length++ }}})

  },

  moveTileDiscardTile : function(BoxToPlace, tileToMove, gameToken){
    Boxes.update({ _id : BoxToPlace._id}, {$set : {hidden : false}});
    Tiles.update({_id : tileToMove._id}, {$set : {tileState : "played"}});
    var boxCount = Boxes.find({gameToken: gameToken, hidden : false}).count();

        if(boxCount === 100){
          Games.update({gameToken: gameToken}, {$set: {finished : true}});
          console.log('game over');
        }else{
          console.log('game still going');
        };

         return true
  },


  clearGame : function (gameToken){
    var game = Games.findOne({"gameToken": gameToken});
    Games.update({_id : game._id}, {$set: {finished : true}});
  }

});