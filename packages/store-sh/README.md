# @telecraft/store-sh

store-sh for [@telecraft/store](../store).

## Installation

```bash
npm install --global @telecraft/store-sh
```

You probably want to install the same version of store-sh as your store, similar to `@telecraft/store-sh@1.0.0-alpha1`

## Usage

This shell is specifically written to work with the reference implementation of [Telecraft's Store plugin](../types/types/Store.d.ts) based on leveldb. If more implementations of Telecraft Store come up in the future, we'll rethink this package.

Navigate to the root folder of your @telecraft/store instance and run `store-sh`, or `store-sh /path/to/root-folder`.

The database shell should show up. First you need to choose a store before you can do anything else. This is typically the plugin you want to inspect.

```bash
> open test_store
'open': store 'test_store'

$test_store > 
```

The store will be created if it doesn't already exist. Now that you've opened a store, you can inspect the store.

```bash
$test_store > get MKRhere
{ userId: 1234 }

$test_store > set MKRhere { "userId": 1200 }
'set': MKRhere

$test_store > find { "userId": 1200 }
'find': found '[ 'MKRhere', { userId: 1200 } ]'

$test_store > list
{ key: 'MKRhere', value: '{ "userId": 1200 }' }

$test_store > del MKRhere
'del': MKRhere

$test_store > clear
This will clear the entire store. Proceed? (y/n)y
'clear': success

$test_store >
```
