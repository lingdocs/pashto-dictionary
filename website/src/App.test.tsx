/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TODO: IndexedDB mocking not working for couchdb - it defaults to disk storage
// tslint:disable-next-line
// require("fake-indexeddb/auto");
// // tslint:disable-next-line
// const FDBFactory = require("fake-indexeddb/lib/FDBFactory");

import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { Types as T } from "@lingdocs/pashto-inflector";
import { Router, BrowserRouter } from "react-router-dom";
import App from './App';
import { dictionary } from "./lib/dictionary";
import {
  mockResults,
} from "./lib/dictionary-mock-fillers";
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import {
  loadUserInfo,
  upgradeAccount,
  publishDictionary,
} from "./lib/backend-calls";
import {
  addSubmission, sendSubmissions,
} from "./lib/submissions";
import * as BT from "./lib/backend-types";
jest.mock("./lib/submissions");
jest.mock("./lib/backend-calls");
jest.mock("./lib/pouch-dbs");
jest.mock("./lib/wordlist-database");
jest.mock("react-ga");

const mockUserInfo = {
  displayName: "Bob Billywinkle",
  email: "bob@example.com",
  providerData: [],
};

const mockCouchDbStudent: BT.CouchDbUser = {
  _id: "123",
  type: "user",
  name: "123",
  email: mockUserInfo.email,
  providerData: [],
  displayName: mockUserInfo.displayName,
  roles: [],
  level: "student",
  userdbPassword: "12345",
}

const mockCouchDbEditor: BT.CouchDbUser = {
  ...mockCouchDbStudent,
  level: "editor",
}

jest.mock("./lib/firebase", (): any => {
  class mockAuth {
    constructor() {
      this.signIn = this.signIn.bind(this);
      this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
      this.unsubscribeAll = this.unsubscribeAll.bind(this);
    }
    private mockUser = {
      displayName: "Bob Billywinkle",
      email: "bob@example.com",
      providerData: [],
      delete: () => {
        this.currentUser = null;
        return Promise.resolve();
      },
    };
    private observers: ((user: any) => void)[] = [];
    public currentUser: any = null;
    onAuthStateChanged (callback: () => void) {
      this.observers.push(callback);
      callback();
      return () => { this.unsubscribeAll() };
    }
    unsubscribeAll () {
      this.observers = [];
    }
    signOut () {
      this.currentUser = null;
      this.observers.forEach((item) => {
        item.call(undefined, this.mockUser);
      });
      return null;
    }
    signIn () {
      this.currentUser = this.mockUser;
      this.observers.forEach((item) => {
        item.call(undefined, this.mockUser);
      });
      return null;
    }
  }
  return {
    auth: new mockAuth(),
  };
});



jest.mock('react-firebaseui/StyledFirebaseAuth', () => function (props: any) {
  return <div>
    <button data-testid="mockSignInButton" onClick={props.firebaseAuth.signIn}>Sign In</button>  
  </div>;
});

const allMockEntries: T.DictionaryEntry[] = Object.keys(mockResults).reduce((all: T.DictionaryEntry[], key: string) => (
  // @ts-ignore
  [...all, ...mockResults[key]]
), []);

const fakeDictInfo: T.DictionaryInfo = {
  title: "not found",
  license: "not found",
  release: 0,
  numberOfEntries: 0,
  url: "not found",
  infoUrl: "not found",
};

const fakeDictionary: DictionaryAPI = {
  initialize: () => Promise.resolve({
    response: "loaded from saved",
    dictionaryInfo: fakeDictInfo,
  }),
  update: () => Promise.resolve({
    response: "no need for update",
    dictionaryInfo: fakeDictInfo,
  }),
  search: function(state: State): T.DictionaryEntry[] {
    if (state.options.searchType === "alphabetical") {
      return state.searchValue === "ا" ? mockResults.alphabeticalA : [];
    }
    if (state.options.language === "Pashto") {
      return state.searchValue === "کور"
        ? mockResults.pashtoKor
        : [];
    }
    if (state.options.language === "English") {
      return state.searchValue === "tired"
        ? mockResults.englishTired as T.DictionaryEntry[]
        : [];
    }
    return [];
  },
  getNewWordsThisMonth: function(): T.DictionaryEntry[] {
    return [];
  },
  findOneByTs: function(ts: number): T.DictionaryEntry | undefined {
    return allMockEntries.find((entry) => entry.ts === ts);
  },
  findRelatedEntries: function(entry: T.DictionaryEntry): T.DictionaryEntry[] {
    // TODO: Better mock
    return allMockEntries.filter((e) => e.e.includes("house"));
  },
  exactPashtoSearch: function(search: string ): T.DictionaryEntry[] {
    return [];
  },
};

const dictionaryPublishResponse = "dictionary published";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(dictionary, "initialize").mockImplementation(() => Promise.resolve("loaded from saved"));
  jest.spyOn(dictionary, "search").mockImplementation(fakeDictionary.search);
  jest.spyOn(dictionary, "findOneByTs").mockImplementation(fakeDictionary.findOneByTs);
  jest.spyOn(dictionary, "findRelatedEntries").mockImplementation(fakeDictionary.findRelatedEntries);
  jest.spyOn(dictionary, "exactPashtoSearch").mockImplementation(fakeDictionary.exactPashtoSearch);
  loadUserInfo.mockResolvedValue(undefined);
  // fetchSuggestions.mockResolvedValue({ ok: true, suggestions: [] });
  upgradeAccount.mockImplementation(async (password: string): Promise<BT.UpgradeUserResponse> => {
    if (password === "correct password") {
      return { ok: true, message: "user upgraded to student" };
    }
    return {
      ok: false,
      error: "incorrect password",
    };
  });
  publishDictionary.mockResolvedValue(dictionaryPublishResponse);
  localStorage.clear();
  // indexedDB = new FDBFactory();
});

// TODO: feed it a fake mini dictionary through JSON - to get more realistic testing
// don't mock the dictionary object

test('renders loading', async () => {
  jest.spyOn(dictionary, "initialize").mockImplementation(() => Promise.resolve("loaded from saved"));
  render(<BrowserRouter><App /></BrowserRouter>);
  const text = screen.getByText(/loading/i);
  expect(text).toBeInTheDocument();
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
});

test('renders error loading', async () => {
  jest.spyOn(dictionary, "initialize").mockImplementation(() => Promise.reject());

  render(<BrowserRouter><App /></BrowserRouter>);
  await waitFor(() => screen.getByText(/error loading/i));
});

test('renders dictionary loaded', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
});

test('searches on type', async () => {
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  // Search Pashto
  let searchInput = screen.getByPlaceholderText(/search pashto/i);
  userEvent.type(searchInput, "کور");
  mockResults.pashtoKor.slice(0, 10).forEach((result) => {
    expect(screen.getAllByText(result.e)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.p)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.f)[0]).toBeInTheDocument();
  });
  expect(history.location.pathname).toBe("/search");
  // Clear
  userEvent.type(searchInput, "{backspace}{backspace}{backspace}");
  mockResults.pashtoKor.slice(0, 10).forEach((result) => {
    expect(screen.queryByText(result.e)).toBeNull();
    expect(screen.queryByText(result.p)).toBeNull();
    expect(screen.queryByText(result.f)).toBeNull();
  });
  expect(history.location.pathname).toBe("/");
  // Switch To English
  const languageToggle = screen.getByTestId("languageToggle");
  userEvent.click(languageToggle);
  expect(screen.queryByPlaceholderText(/search pashto/i)).toBeNull();
  searchInput = screen.getByPlaceholderText(/search english/i);
  userEvent.type(searchInput, "tired");
  mockResults.englishTired.slice(0, 10).forEach((result) => {
    expect(screen.getAllByText(result.e)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.p)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.f)[0]).toBeInTheDocument();
  });
  expect(history.location.pathname).toBe("/search");
  // Clear
  const clearButton = screen.getByTestId("clearButton");
  userEvent.click(clearButton);
  mockResults.englishTired.slice(0, 10).forEach((result) => {
    expect(screen.queryByText(result.e)).toBeNull();
    expect(screen.queryByText(result.p)).toBeNull();
    expect(screen.queryByText(result.f)).toBeNull();
  });
  // Search again
  userEvent.type(searchInput, "tired");
  mockResults.englishTired.slice(0, 10).forEach((result) => {
    expect(screen.getAllByText(result.e)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.p)[0]).toBeInTheDocument();
    expect(screen.getAllByText(result.f)[0]).toBeInTheDocument();
  });
  // Go back
  history.goBack();
  expect(history.location.pathname).toBe("/");
});

test('does alphabetical browse search', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  expect(screen.queryByText(/alphabetical browsing mode/i)).toBeNull();
  const searchTypeButton = screen.getByTestId("searchTypeToggle");
  userEvent.click(searchTypeButton);
  expect(screen.queryByText(/alphabetical browsing mode/i)).toBeInTheDocument();
  const searchInput = screen.getByPlaceholderText(/browse/i);
  userEvent.type(searchInput, "ا");
  mockResults.alphabeticalA.forEach((entry) => {
    expect(screen.queryAllByText(entry.e)).toBeTruthy;
  });
  userEvent.type(searchInput, "{backspace}");
  userEvent.type(searchInput, "ززززز");
  expect(screen.queryByText(/no results found/i)).toBeInTheDocument();
  expect(screen.queryByText(/You are using alphabetical browsing mode/i)).toBeInTheDocument();
});

test('isolates word on click', async () => {
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  let searchInput = screen.getByPlaceholderText(/search pashto/i);
  userEvent.type(searchInput, "کور");
  expect(history.location.pathname).toBe("/search");
  const firstResult = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResult);
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  expect(history.location.pathname).toBe("/word");
  const params = new URLSearchParams(history.location.search);
  const wordId = params.get("id");
  expect(wordId && parseInt(wordId)).toBe(mockResults.pashtoKor[0].ts);
  // should leave word when going back
  history.goBack();
  expect(history.location.pathname).toBe("/search");
  // go back to word when going forward
  history.goForward();
  expect(history.location.pathname).toBe("/word");
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  // leave word when clearing
  const clearButton = screen.getByTestId("clearButton");
  userEvent.click(clearButton);
  expect(history.location.pathname).toBe("/")
  expect(screen.queryByText(/related words/i)).toBeNull();
  userEvent.type(searchInput, "کور");
  expect(history.location.pathname).toBe("/search");
  const firstResultb = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResultb);
  expect(history.location.pathname).toBe("/word");
  // leave word when searching
  const input = screen.getByTestId("searchInput");
  userEvent.type(input, "سړی");
  expect(history.location.pathname).toBe("/search");
  expect(screen.queryByText(/related words/i)).toBeNull();
  expect(screen.queryByText(/no results found/i)).toBeTruthy();
  const clearButton1 = screen.getByTestId("clearButton");
  userEvent.click(clearButton1);
  expect(history.location.pathname).toBe("/");
  // search click on a word again
  userEvent.type(searchInput, "کور");
  expect(history.location.pathname).toBe("/search");
  const firstResultc = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResultc);
  expect(history.location.pathname).toBe("/word")
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  expect(history.location.search).toBe(`?id=${mockResults.pashtoKor[0].ts}`);
  const relatedEntry = mockResults.pashtoKor.filter((entry) => entry.e.includes("house"))[1] as T.DictionaryEntry;
  const otherResult = screen.getByText(relatedEntry.p);
  userEvent.click(otherResult);
  expect(history.location.pathname).toBe(`/word`);
  expect(history.location.search).toBe(`?id=${relatedEntry.ts}`);
  // search for a word that uses a complement
  userEvent.click(clearButton1);
  const languageToggle = screen.getByTestId("languageToggle");
  userEvent.click(languageToggle);
  userEvent.type(searchInput, "tired");
  const resultWComplement = mockResults.englishTired.find((entry) => entry.c.includes(" comp.") && entry.l) as T.DictionaryEntry;
  userEvent.click(screen.getByText(resultWComplement.e));
  expect(history.location.pathname).toBe(`/word`);
  expect(history.location.search).toBe(`?id=${resultWComplement.ts}`);
  expect(screen.queryByText(resultWComplement.e)).toBeInTheDocument();
});

test('shows about page', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  const aboutButton = screen.getByText(/about/i);
  userEvent.click(aboutButton);
  expect(screen.queryByText(/inspiration and sources/i)).toBeInTheDocument();
  const homeButton = screen.getByText(/home/i);
  userEvent.click(homeButton);
  expect(screen.queryByText(/inspiration and sources/i)).toBeNull();
});

test('starts on about page when starting from /about', async () => {
  const history = createMemoryHistory();
  history.push("/about");
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/about/i));
  expect(screen.queryByText(/inspiration and sources/i)).toBeInTheDocument();
  const homeButton = screen.getByText(/home/i);
  userEvent.click(homeButton);
  expect(screen.queryByText(/inspiration and sources/i)).toBeNull();
});

test('shows settings page / settings page works', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  const settingsButton = screen.getAllByText(/settings/i)[0];
  userEvent.click(settingsButton);
  expect(screen.queryByText(/diacritics/i)).toBeInTheDocument();
  const homeButton = screen.getByText(/home/i);
  userEvent.click(homeButton);
  expect(screen.queryByText(/diacritics/i)).toBeNull();
  // play with settings
  const settingsButton1 = screen.getAllByText(/settings/i)[0];
  userEvent.click(settingsButton1);
  const darkButton = screen.getByText(/dark/i);
  userEvent.click(darkButton);
  const lightButton = screen.getByText(/light/i);
  userEvent.click(lightButton);
});

test('starts on settings page when starting from /settings', async () => {
  const history = createMemoryHistory();
  history.push("/settings");
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/settings/i));
  expect(screen.queryByText(/diacritics/i)).toBeInTheDocument();
  const homeButton = screen.getByText(/home/i);
  userEvent.click(homeButton);
  expect(screen.queryByText(/diacritics/i)).toBeNull();
});

test('persists settings', async () => {
  const history = createMemoryHistory();
  history.push("/settings");
  const { unmount, rerender } = render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/settings/i));
  const darkButton = screen.getByText(/dark/i);
  const lightButton = screen.getByText(/light/i);
  expect(darkButton.className.toString().includes("active")).toBe(false);
  expect(lightButton.className.toString().includes("active")).toBe(true);
  userEvent.click(darkButton);
  expect(darkButton.className.toString().includes("active")).toBe(true);
  expect(lightButton.className.toString().includes("active")).toBe(false);
  const afghanSp = screen.getByText(/afghan/i);
  const pakSp = screen.getByText(/pakistani ی/i);
  expect(afghanSp.className.toString().includes("active")).toBe(true);
  expect(pakSp.className.toString().includes("active")).toBe(false);
  userEvent.click(pakSp);  
  expect(afghanSp.className.toString().includes("active")).toBe(false);
  expect(pakSp.className.toString().includes("active")).toBe(true);
  unmount();
  rerender(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/settings/i));
  const afghanSp1 = screen.getByText(/afghan/i);
  const pakSp1 = screen.getByText(/pakistani ی/i);
  const darkButton1 = screen.getByText(/dark/i);
  const lightButton1 = screen.getByText(/light/i);
  expect(darkButton1.className.toString().includes("active")).toBe(true);
  expect(lightButton1.className.toString().includes("active")).toBe(false);
  expect(afghanSp1.className.toString().includes("active")).toBe(false);
  expect(pakSp1.className.toString().includes("active")).toBe(true);
});

test('starts on home page when starting on invalid page', async () => {
  const history = createMemoryHistory();
  history.push("/search");
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/lingdocs pashto dictionary/i));
  expect(history.location.pathname).toBe("/");
});

test('starts on home page when starting on an unauthorized page', async () => {
  const history = createMemoryHistory();
  history.push("/edits");
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/lingdocs pashto dictionary/i));
  expect(history.location.pathname).toBe("/");
});

test('starts on isolated word when starting from /word?id=_____', async () => {
  const history = createMemoryHistory();
  const entry = mockResults.pashtoKor[0];
  history.push(`/word?id=${entry.ts}`);
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/related words/i));
  expect(screen.queryAllByText(entry.p)).toBeTruthy();
});

test('says word not found if starting on /word?id=_____ with an unfound id', async () => {
  const history = createMemoryHistory();
  const entry = mockResults.pashtoKor[0];
  history.push(`/word?id=${entry.ts + 20000}`);
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/word not found/i));
});

test('goes to home page if starts with /word but without an id param', async () => {
  const history = createMemoryHistory();
  const entry = mockResults.pashtoKor[0];
  history.push(`/word?badparam=${entry.ts}`);
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getAllByText(/lingdocs pashto dictionary/i));
  expect(history.location.pathname).toBe("/");
});

test('sign in and out of account works', async () => {
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  userEvent.click(screen.getByText(/sign in/i));
  expect(screen.queryByText(/sign in to be able to/i)).toBeInTheDocument();
  userEvent.click(screen.getByTestId("mockSignInButton"));
  expect(screen.queryByText(new RegExp(mockUserInfo.email))).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(mockUserInfo.displayName))).toBeInTheDocument();
  userEvent.click(screen.getByText(/home/i));
  // now to get back to the account page there should be an account button, not a sign-in button
  expect(screen.queryByText(/sign in/i)).toBeNull();
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByTestId("signoutButton"));
  expect(history.location.pathname).toBe("/");
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  // sign back in and delete account
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  userEvent.click(screen.getByText(/delete account/i));
  expect(screen.queryByText(/yes, delete my account/i)).toBeInTheDocument();
  userEvent.click(screen.getByText(/no, cancel/i));
  await waitForElementToBeRemoved(() => screen.queryByText(/yes, delete my account/i));
  userEvent.click(screen.getByText(/delete account/i));
  userEvent.click(screen.getByText(/yes, delete my account/i));
  await waitFor(() => screen.queryByText(/Your account has been deleted/i));
  expect(history.location.pathname).toBe("/account");
  userEvent.click(screen.getAllByText(/home/i)[0]);
  expect(history.location.pathname).toBe("/");
});

test('word edit suggestion works', async () => {
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  // first try without signing in
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  let searchInput = screen.getByPlaceholderText(/search pashto/i);
  userEvent.type(searchInput, "کور");
  expect(history.location.pathname).toBe("/search");
  let firstResult = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResult);
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  // the edit button should not be there
  expect(screen.queryByTestId(/editEntryButton/i)).toBeNull();
  // nor should the finalEdit button
  expect(screen.queryByTestId(/finalEditEntryButton/i)).toBeNull();
  // sign in to be able to suggest an edit
  history.goBack();
  history.goBack();
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  expect(sendSubmissions).toHaveBeenCalledTimes(1);
  userEvent.click(screen.getByText(/home/i));
  userEvent.type(searchInput, "کور");
  firstResult = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResult);
  // the final edit button should not be there
  expect(screen.queryByTestId(/finalEditEntryButton/i)).toBeNull();
  userEvent.click(screen.getByTestId(/editEntryButton/i));
  userEvent.type(screen.getByLabelText(/Suggest correction\/edit:/i), "my suggestion");
  userEvent.click(screen.getByText(/cancel/i));
  expect(screen.queryByLabelText(/Suggest correction\/edit:/i)).toBeNull();
  userEvent.click(screen.getByTestId(/editEntryButton/i));
  userEvent.type(screen.getByLabelText(/Suggest correction\/edit:/i), "my comment");
  userEvent.click(screen.getByText(/submit/i));
  expect(screen.queryByText(/Thank you for your help!/i)).toBeInTheDocument();
  expect(addSubmission).toHaveBeenCalledTimes(1);
  expect(addSubmission).toHaveBeenCalledWith(expect.objectContaining({
    entry: mockResults.pashtoKor[0], 
    comment: "my comment",
  }), "basic");
  history.goBack();
  history.goBack();
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByText(/sign out/i));
});

test('upgrade account works', async () => {
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  userEvent.click(screen.getByText(/sign in/i));
  expect(screen.queryByText(/sign in to be able to/i)).toBeInTheDocument();
  userEvent.click(screen.getByTestId("mockSignInButton"));
  expect(screen.queryByText(new RegExp(mockUserInfo.email))).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(mockUserInfo.displayName))).toBeInTheDocument();
  expect(screen.queryByText(/level: basic/i)).toBeInTheDocument();
  userEvent.click(screen.getByText(/upgrade account/i));
  userEvent.type(screen.getByLabelText(/upgrade password:/i), "something wrong");
  userEvent.click(screen.getByText(/upgrade my account/i));
  await waitFor(() => screen.queryByText(/incorrect password/i));
  userEvent.click(screen.getByText(/cancel/i));
  await waitFor(() => screen.getByText(/upgrade account/i));
  userEvent.click(screen.getByText(/upgrade account/i));
  userEvent.type(screen.getByLabelText(/upgrade password:/i), "correct password");
  loadUserInfo.mockResolvedValue(mockCouchDbStudent);
  userEvent.click(screen.getByText(/upgrade my account/i));
  await waitForElementToBeRemoved(() => screen.getAllByText(/upgrade account/i));
  userEvent.click(screen.getByText(/sign out/i));
});

test('editor priveledges show up and allow you to make a final edit of an entry', async () => {
  loadUserInfo.mockResolvedValue(mockCouchDbEditor);
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/account level: editor/i));
  expect(sendSubmissions).toHaveBeenCalledTimes(1);
  userEvent.click(screen.getByText(/home/i));
  expect(screen.getByText(/editor priveleges active/i)).toBeInTheDocument()
  let searchInput = screen.getByPlaceholderText(/search pashto/i);
  userEvent.type(searchInput, "کور");
  expect(history.location.pathname).toBe("/search");
  let firstResult = screen.getByText(mockResults.pashtoKor[0].e);
  userEvent.click(firstResult);
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  // the edit button should be there
  expect(screen.getByTestId("editEntryButton")).toBeInTheDocument();
  // the final edit button should also be there
  expect(screen.getByTestId("finalEditEntryButton")).toBeInTheDocument();
  userEvent.click(screen.getByTestId("finalEditEntryButton"));
  userEvent.type(screen.getByLabelText(/english/i), " adding more in english");
  userEvent.click(screen.getByLabelText(/no inflection/i));
  userEvent.click(screen.getByText(/submit/i));
  expect(screen.getByText(/edit submitted\/saved/i)).toBeInTheDocument();
  expect(addSubmission).toHaveBeenCalledTimes(1);
  expect(addSubmission).toHaveBeenCalledWith(expect.objectContaining({
    type: "entry edit",
    entry: {
      ...mockResults.pashtoKor[0],
      e: mockResults.pashtoKor[0].e + " adding more in english",
      noInf: true,
    }, 
  }), "editor");
  userEvent.click(screen.getByTestId(/navItemHome/i));
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByText(/sign out/i));
});

test('editor should be able to publish the dictionary', async () => {
  loadUserInfo.mockResolvedValue(undefined);
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/account level: basic/i));
  // publish dictionary option should not be available to non editor
  expect(screen.queryByText(/publish dictionary/i)).toBeNull();
  userEvent.click(screen.getByText(/sign out/i));
  userEvent.click(screen.getByText(/sign in/i));
  loadUserInfo.mockResolvedValue(mockCouchDbStudent);
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/account level: student/i));
  // publish dictionary option should not be available to non editor
  expect(screen.queryByText(/publish dictionary/i)).toBeNull();
  userEvent.click(screen.getByText(/sign out/i));
  userEvent.click(screen.getByText(/sign in/i));
  loadUserInfo.mockResolvedValue(mockCouchDbEditor);
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/account level: editor/i));
  // publish dictionary options should only be available to editor
  userEvent.click(screen.getByText(/publish dictionary/i));
  expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
  await waitFor(() => screen.getByText(JSON.stringify(dictionaryPublishResponse, null, "\\t")));
  userEvent.click(screen.getByText(/sign out/i));
});

test('wordlist should be hidden from basic users and available for upgraded users', async () => {
  loadUserInfo.mockResolvedValue(undefined);
  const history = createMemoryHistory();
  render(<Router history={history}><App /></Router>);
  await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
  // doesn't exist on basic accounts signed in or not
  expect(screen.queryByText(/wordlist/i)).toBeNull();
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.queryByText(mockUserInfo.displayName));
  userEvent.click(screen.getByText(/home/i));
  expect(screen.queryByText(/wordlist/i)).toBeNull();
  userEvent.type(screen.getByPlaceholderText(/search pashto/i), "کور");
  expect(history.location.pathname).toBe("/search");
  userEvent.click(screen.getByText(mockResults.pashtoKor[0].e));
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  // shouldn't be able to see the add to wordlist star
  expect(screen.queryByTestId("emptyStarButton")).toBeNull();
  expect(screen.queryByTestId("fullStarButton")).toBeNull();
  history.goBack();
  history.goBack();
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByText(/sign out/i));
  loadUserInfo.mockResolvedValue(mockCouchDbStudent);
  // does exist for student account
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/level: student/i));
  userEvent.click(screen.getByText(/home/i));
  expect(screen.getByText(/wordlist/i)).toBeInTheDocument();
  userEvent.type(screen.getByPlaceholderText(/search pashto/i), "کور");
  expect(history.location.pathname).toBe("/search");
  userEvent.click(screen.getByText(mockResults.pashtoKor[0].e));
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  // should be able to see the word list star
  expect(screen.queryByTestId("emptyStarButton")).toBeInTheDocument();
  history.goBack();
  history.goBack();
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByText(/sign out/i));
  loadUserInfo.mockResolvedValue(mockCouchDbEditor);
  // also exists for editor account
  userEvent.click(screen.getByText(/sign in/i));
  userEvent.click(screen.getByTestId("mockSignInButton"));
  await waitFor(() => screen.getByText(/level: editor/i));
  userEvent.click(screen.getByText(/home/i));
  expect(screen.getByText(/wordlist/i)).toBeInTheDocument();
  userEvent.type(screen.getByPlaceholderText(/search pashto/i), "کور");
  expect(history.location.pathname).toBe("/search");
  userEvent.click(screen.getByText(mockResults.pashtoKor[0].e));
  expect(screen.getByText(/related words/i)).toBeInTheDocument();
  expect(screen.getByTestId("emptyStarButton")).toBeInTheDocument();
  history.goBack();
  history.goBack();
  userEvent.click(screen.getByText(/account/i));
  userEvent.click(screen.getByText(/sign out/i));
});

// test('wordlist adding and removing should work', async () => {
//   const wordNotes = "my test notes";
//   const noteAddition = " and some more";
//   const wordToAdd = mockResults.pashtoKor[0];
//   loadUserInfo.mockResolvedValue(mockCouchDbStudent);
//   const history = createMemoryHistory();
//   render(<Router history={history}><App /></Router>);
//   await waitFor(() => screen.getByText(/lingdocs pashto dictionary/i));
//   userEvent.click(screen.getByText(/sign in/i));
//   userEvent.click(screen.getByTestId("mockSignInButton"));
//   await waitFor(() => screen.getByText(/level: student/i));
//   userEvent.click(screen.getByText(/home/i));
//   expect(screen.getByText(/wordlist/i)).toBeInTheDocument();
//   userEvent.type(screen.getByPlaceholderText(/search pashto/i), "کور");
//   expect(history.location.pathname).toBe("/search");
//   userEvent.click(screen.getByText(wordToAdd.e));
//   // should be able to see the word list star
//   expect(screen.getByTestId("emptyStarButton")).toBeInTheDocument();
//   userEvent.click(screen.getByTestId("emptyStarButton"));
//   await waitFor(() => screen.getByTestId("fullStarButton"));
//   userEvent.type(screen.getByTestId("wordlistWordContextForm"), wordNotes);
//   userEvent.click(screen.getByText(/save context/i));
//   userEvent.click(screen.getByTestId("backButton"));
//   userEvent.click(screen.getByTestId("backButton"));
//   // should have one word in wordlist for review
//   userEvent.click(screen.getByText("Wordlist (1)"));
//   // should appear on screen with notes
//   userEvent.click(screen.getByText(/browse/i));
//   expect(screen.getByText(wordNotes)).toBeInTheDocument();
//   // notes should be editable
//   userEvent.click(screen.getByText(wordToAdd.e));
//   userEvent.type(screen.getByText(wordNotes), noteAddition);
//   userEvent.click(screen.getByText(/save context/i));
//   await waitFor(() => screen.getByText(/context saved/i));
//   userEvent.click(screen.getByText(wordToAdd.e));
//   expect(screen.queryByText(/context saved/)).toBeNull();
//   expect(screen.getByText(wordNotes + noteAddition)).toBeInTheDocument();
//   // should be able to delete from the browsing screen
//   userEvent.click(screen.getByText(wordToAdd.e));
//   userEvent.click(screen.getByText(/delete/i));
//   await waitForElementToBeRemoved(() => screen.getByText(wordToAdd.e));
//   userEvent.click(screen.getByText(/home/i));
//   // now try adding and deleting a word from the isolated word screen
//   userEvent.type(screen.getByPlaceholderText(/search pashto/i), "کور");
//   expect(history.location.pathname).toBe("/search");
//   userEvent.click(screen.getByText(wordToAdd.e));
//   expect(screen.getByTestId("emptyStarButton")).toBeInTheDocument();
//   userEvent.click(screen.getByTestId("emptyStarButton"));
//   await waitFor(() => screen.getByTestId("fullStarButton"));
//   userEvent.click(screen.getByTestId("backButton"));
//   userEvent.click(screen.getByTestId("backButton"));
//   userEvent.click(screen.getByText(/wordlist.*/i));
//   userEvent.click(screen.getByText(/browse/i));
//   // go back to isolated word screen from the dictionary entry button
//   userEvent.click(screen.getByText(wordToAdd.e));
//   userEvent.click(screen.getByText(/dictionary entry/i));
//   expect(screen.getByText(/related words/i)).toBeInTheDocument();
//   expect(history.location.pathname).toBe("/word");
//   // delete the word from the wordlist from the isolated word screen
//   userEvent.click(screen.getByTestId("fullStarButton"));
//   userEvent.click(screen.getByText(/cancel/i));
//   userEvent.click(screen.getByTestId("fullStarButton"));
//   userEvent.click(screen.getByTestId("confirmDeleteFromWordlist"));
//   await waitFor(() => screen.getByTestId("emptyStarButton"));
//   userEvent.click(screen.getByTestId("backButton"));
//   expect(screen.queryByText(/wordlist is empty/i)).toBeInTheDocument();
// });

// TODO: REMOVE waitFor(() => screen.//queryByText// )

// TODO: Test review
