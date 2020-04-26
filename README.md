# Welcome to Optime GB!

This is a Game Boy/Color emulator I have been writing for fun the past few months.

I do have a C# port of the emulator that's been abandoned due to lack of interest.
But if you want to check it out anyways, it's in the `master` branch.

* For some reason, the AudioBuffer constructor is broken on Safari.
  Use AudioContext.createBuffer() as a replacement for the AudioBuffer constructor.

# Building

```
npm install --dev
webpack
```

Output will be in the `dist` directory.