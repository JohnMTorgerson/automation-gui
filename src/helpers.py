def object_equals(a, b):
	try:
		assert isinstance(a, dict)
		assert isinstance(b, dict)
	except AssertionError as e:
		raise TypeError("both arguments must be an instance of dict") from e
	for key in a:
		if key not in b:
			return False
		if isinstance(a[key], dict):
			try:
				equal = object_equals(a[key], b[key])
			except AssertionError as e:
				return False  # we get here if a[key] is a dict but b[key] is not a dict
		else:
			equal = a[key] == b[key]
		if not equal:
			return False
	for key in b:
		if key not in a:
			return False
	return True
