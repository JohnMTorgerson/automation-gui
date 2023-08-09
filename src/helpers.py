def object_equals(a, b, blacklist=[], recurse_blacklist=False):
	try:
		assert isinstance(a, dict)
		assert isinstance(b, dict)
	except AssertionError as e:
		raise TypeError("first two arguments must both be an instance of dict") from e
	for key in a:
		# ignore any keys in the blacklist
		if key in blacklist :
			continue

		if key not in b:
			return False
		if isinstance(a[key], dict):
			try:
				equal = object_equals(a[key], b[key], blacklist=(blacklist if recurse_blacklist else []), recurse_blacklist=recurse_blacklist)
			except AssertionError as e:
				return False  # we get here if a[key] is a dict but b[key] is not a dict
		else:
			equal = a[key] == b[key]
		if not equal:
			return False
	for key in b:
		if key not in a and key not in blacklist:
			return False
	return True
