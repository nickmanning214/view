_.mixin({
  hash_filter: function(hash, test_function) {
     var filtered, key, keys, i;
  keys = Object.keys(hash);
  filtered = {};
  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    if (test_function(hash[key])) {
      filtered[key] = hash[key];
    }
  }
  return filtered;
  }
});

