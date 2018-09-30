// game setup
var turn = 0;
var board = [];
var gameId = 0;

const winCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function player() {
  var symbol = 0;
  if (turn % 2 === 0 || turn === 0) {
    symbol = 'rocket'
  } else {
    symbol = 'space-shuttle'
  }
  return symbol;
}

function updateState(square) {
  if (!$("square > i").hasClass("fa-rocket") && !$("this > i").hasClass("fa-space-shuttle")) {
    square.firstElementChild.classList.add("fa-" + player());
    square.classList.add("filled");
  }
}

function setMessage(string) {
  $('div#message').text(string);
}

function winningCombo(array) {
  return array.every(el => el.classList.contains("fa-rocket")) || array.every(el => el.classList.contains("fa-space-shuttle"))
}

function checkWinner() {
  let message = "";
  let winner = false;
  let currentBoard = gameBoard();
  winCombinations.forEach(combo => {
		position1 = currentBoard[combo[0]]
		position2 = currentBoard[combo[1]]
		position3 = currentBoard[combo[2]]

    if (winningCombo([position1, position2, position3])) {
      winner = true;
      message = `${plurify(player())} Won!`;
      setMessage(message);
    }
  })
  return winner
}

function plurify(string) {
  string = `${string[0].toUpperCase()}` + `${string.substring(1)}`
  return string + "s";
}

function doTurn(square) {
  updateState(square);
  turn += 1;

  if (checkWinner()) {
    saveGame()
    resetBoard();
  } else if (turn === 9) {
    setMessage("Tie game.");
    saveGame()
    resetBoard();
  }
}

function gameBoard() {
  for (el of $('i.fa')) {
    board.push(el);
  }
  return board
}

function resetBoard() {
  board = [];
  turn = 0;
  gameId = 0
  $("i").removeClass("fa-rocket fa-space-shuttle");
  $("card").removeClass("filled");
  setMessage("")
}

function attachListeners() {
  $("li.card").on('click', function() {
    if (!$("this > i").hasClass("fa-rocket") && !$("this > i").hasClass("fa-space-shuttle") && !checkWinner()) {
      doTurn(this);
    }
  });
  $('#previous').on('click', () => previousGames());
  $('#save').on('click', () => saveGame());
  $('#clear').on('click', () => resetBoard());
}

function previousGames() {
  // if #games is already populated, don't do anything (simplest implementation)
  if ($("#games").html() === "") {
    $.get("/games").done(function(response) {
      // the response contains a data array - to load invidiual games, store the id values of each game to construct the route for get 'games/:id'
      var gamesIds = response.data.map(game => game.id);
      gamesIds.forEach(id =>
        $("#games").append(`<button class='previous-games' id="${id}">Game Number: ${id}</button><br>`))
        // button needs to have click event bound to it
      $("button.previous-games").on('click', function(event) {
        event.preventDefault();
        loadGame(this.id);
      });
    });
  }
}

function loadGame(id) {
  $.get(`/games/${id}`, function(response) {
    var loadState = response.data.attributes.state;
    for (var i = 0; i < loadState.length; i++) {
      $("td").eq(i).text(loadState[i])
    }
    gameId = response.id;
    turn = loadState.join("").length;
  })
}

function saveGame() {
  // grab all the table data squares, assemble them into an array, and make new array with only inner text
  // JQuery returns a special kind of object, not an array, so it's not mappable and needs toArray method()
  var gameData = $("td").toArray();
  var boardState = gameData.map(square => square.textContent);
  // post game state to server
  if (gameId) {
    // 'ajax' required here instead of post because PATH method needs to be specified in request
    $.ajax({
      type: 'PATCH',
        // patch to '/games/:id'
      url: `/games/${gameId}`,
        // 'state' will go into the params hash and is whitelisted by strong params
      data: { state: boardState }
    });
  } else {
    $.post("/games", { state: boardState }).done(function (response) {
      $('#games').append(`<button id="${response.data.id}">Game Number: ${response.data.id}</button><br>`);
      gameId = response.data.id;
    })
  }
}

$(document).ready(function() {
  attachListeners();
});
