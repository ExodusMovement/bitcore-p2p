'use strict';

var bitcore = require('@exodus/bitcore-lib');
var Inventory = require('../inventory');
var assert = require('assert');

// const StackUtils = require('stack-utils')
// const stack = new StackUtils({cwd: process.cwd(), internals: StackUtils.nodeInternals()})

// TODO: TOTAL HACK
const protocolMap = {
  bitcoin: 70012,
  dash: 70103,
  dogecoin: 70004,
  litecoin: 70003
};

function builder(options) {
  /* jshint maxstatements: 20 */
  /* jshint maxcomplexity: 10 */

  assert(options, 'Must pass options to Messages');
  assert(options.network, 'Must pass network to Messages');

  // TODO: FIX
  if (!options.protocolVersion) {
    options.protocolVersion = protocolMap[options.network.name];
  }
  assert(options.protocolVersion, 'Must pass protocolVersion to Messages');

  options.Block = options.Block || bitcore.Block;
  options.BlockHeader = options.BlockHeader || bitcore.BlockHeader;
  options.Transaction = options.Transaction || bitcore.Transaction;
  options.MerkleBlock = options.MerkleBlock || bitcore.MerkleBlock;

  var exported = {
    constructors: {
      Block: options.Block,
      BlockHeader: options.BlockHeader,
      Transaction: options.Transaction,
      MerkleBlock: options.MerkleBlock
    },
    defaults: {
      protocolVersion: options.protocolVersion,
      network: options.network
    },
    inventoryCommands: [
      'getdata',
      'inv',
      'notfound'
    ],
    commandsMap: {
      version: 'Version',
      verack: 'VerAck',
      ping: 'Ping',
      pong: 'Pong',
      block: 'Block',
      tx: 'Transaction',
      getdata: 'GetData',
      headers: 'Headers',
      notfound: 'NotFound',
      inv: 'Inventory',
      addr: 'Addresses',
      alert: 'Alert',
      reject: 'Reject',
      merkleblock: 'MerkleBlock',
      filterload: 'FilterLoad',
      filteradd: 'FilterAdd',
      filterclear: 'FilterClear',
      getblocks: 'GetBlocks',
      getheaders: 'GetHeaders',
      mempool: 'MemPool',
      getaddr: 'GetAddr'
    },
    commands: {}
  };

  exported.add = function(key, Command) {
    exported.commands[key] = function(obj) {
      return new Command(obj, options);
    };

    exported.commands[key]._constructor = Command;

    exported.commands[key].fromBuffer = function(buffer) {
      var message = exported.commands[key]();
      message.setPayload(buffer);
      return message;
    };
  };

  // NOTE:
  // we have to do this for Browserify build
  /* Object.keys(exported.commandsMap).forEach(function (key) {
    exported.add(key, require('./commands/' + key))
  }) */

  exported.add('version', require('./commands/version'));
  exported.add('verack', require('./commands/verack'));
  exported.add('ping', require('./commands/ping'));
  exported.add('pong', require('./commands/pong'));
  exported.add('block', require('./commands/block'));
  exported.add('tx', require('./commands/tx'));
  exported.add('getdata', require('./commands/getdata'));
  exported.add('headers', require('./commands/headers'));
  exported.add('notfound', require('./commands/notfound'));
  exported.add('inv', require('./commands/inv'));
  exported.add('addr', require('./commands/addr'));
  exported.add('alert', require('./commands/alert'));
  exported.add('reject', require('./commands/reject'));
  exported.add('merkleblock', require('./commands/merkleblock'));
  exported.add('filterload', require('./commands/filterload'));
  exported.add('filteradd', require('./commands/filteradd'));
  exported.add('filterclear', require('./commands/filterclear'));
  exported.add('getblocks', require('./commands/getblocks'));
  exported.add('getheaders', require('./commands/getheaders'));
  exported.add('mempool', require('./commands/mempool'));
  exported.add('getaddr', require('./commands/getaddr'));

  // can be removed when OSS
  // END NOTE

  exported.inventoryCommands.forEach(function(command) {

    // add forTransaction methods
    exported.commands[command].forTransaction = function forTransaction(hash) {
      return new exported.commands[command]([Inventory.forTransaction(hash)]);
    };

    // add forBlock methods
    exported.commands[command].forBlock = function forBlock(hash) {
      return new exported.commands[command]([Inventory.forBlock(hash)]);
    };

    // add forFilteredBlock methods
    exported.commands[command].forFilteredBlock = function forFilteredBlock(hash) {
      return new exported.commands[command]([Inventory.forFilteredBlock(hash)]);
    };

  });

  return exported;

}

module.exports = builder;
