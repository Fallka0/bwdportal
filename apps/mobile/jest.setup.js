/* global jest */
// AsyncStorage gibt es in Jest nicht nativ: offizieller Mock des Pakets.
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
