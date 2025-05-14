export function validateUser(object: any): string | null {
  if (!object.username || !(typeof object.username === 'string')) {
    return 'Username is not provided or not a string.'
  }

  if (!object.age || !(typeof object.age === 'number')) {
    return 'Age is not provided or not a number.'
  }

  if (!object.age || !Array.isArray(object.hobbies)) {
    return 'Hobbies is not provided or not an array.'
  }

  for (const hobby of object.hobbies) {
    if (typeof hobby !== 'string') {
      return 'Element of hobbies array must be a string.'
    }
  }

  return null;
}
