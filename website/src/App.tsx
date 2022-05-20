/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TODO: Put the DB sync on the localDb object, and then have it cancel()'ed and removed as part of the deinitialization
// sync on initialization and cancel sync on de-initialization

import { Component } from "react";
import { defaultTextOptions } from "@lingdocs/pashto-inflector";
import { withRouter, Route, RouteComponentProps, Link } from "react-router-dom";
import Helmet from "react-helmet";
import BottomNavItem from "./components/BottomNavItem";
import SearchBar from "./components/SearchBar";
import DictionaryStatusDisplay from "./components/DictionaryStatusDisplay";
import About from "./screens/About";
import Options from "./screens/Options";
import Results from "./screens/Results";
import Account from "./screens/Account";
import ReviewTasks from "./screens/ReviewTasks";
import EntryEditor from "./screens/EntryEditor";
import IsolatedEntry from "./screens/IsolatedEntry";
import Wordlist from "./screens/Wordlist";
import { wordlistEnabled } from "./lib/level-management";
import { 
    saveOptions,
    readOptions,
    saveUser,
    readUser,
} from "./lib/local-storage";
import { dictionary, pageSize } from "./lib/dictionary";
import {
    optionsReducer,
    textOptionsReducer,
    resolveTextOptions,
    removePTextSize,
} from "./lib/options-reducer";
import hitBottom from "./lib/hitBottom";
import getWordId from "./lib/get-word-id";
import { CronJob } from "cron";
import Mousetrap from "mousetrap";
import {
    sendSubmissions,
} from "./lib/submissions";
import { 
    getUser,
    updateUserTextOptionsRecord,
} from "./lib/backend-calls";
import {
    getWordlist,
} from "./lib/wordlist-database";
import {
    startLocalDbs,
    stopLocalDbs,
    getAllDocsLocalDb,
} from "./lib/pouch-dbs";
import {
    forReview,
} from "./lib/spaced-repetition";
import {
    textBadge,
} from "./lib/badges";
import * as AT from "./types/account-types";
import ReactGA from "react-ga";
// tslint:disable-next-line
import "@fortawesome/fontawesome-free/css/all.css";
import "./custom-bootstrap.scss";
// tslint:disable-next-line: ordered-imports
import "./App.css";
import classNames from "classnames";
import { getTextOptions } from "./lib/get-text-options";
import { getTextFromShareTarget } from "./lib/share-target";
import { objIsEqual, userObjIsEqual } from "./lib/misc-helpers";
import {
    State,
    TextOptionsRecord,
    TextOptionsAction,
    OptionsAction,
} from "./types/dictionary-types";
import PhraseBuilder from "./screens/PhraseBuilder";

// FIXME why

// to allow Moustrap key combos even when input fields are in focus
Mousetrap.prototype.stopCallback = function () {
    return false;
}

const prod = document.location.hostname === "dictionary.lingdocs.com";

if (prod) {
    ReactGA.initialize("UA-196576671-1");
    ReactGA.set({ anonymizeIp: true });
}

const possibleLandingPages = [
    "/", "/about", "/settings", "/word", "/account", "/new-entries", "/share-target",
];
const editorOnlyPages = [
    "/edit", "/review-tasks",
];

class App extends Component<RouteComponentProps, State> {
    constructor(props: RouteComponentProps) {
        super(props);
        const savedOptions = readOptions();
        this.state = {
            dictionaryStatus: "loading",
            dictionaryInfo: undefined,
            // TODO: Choose between the saved options and the options in the saved user
            options: savedOptions ? savedOptions : {
              language: "Pashto",
              searchType: "fuzzy",
              theme: /* istanbul ignore next */ (window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
              textOptionsRecord: {
                lastModified: Date.now() as AT.TimeStamp,
                textOptions: defaultTextOptions,
              },
              wordlistMode: "browse",
              wordlistReviewLanguage: "Pashto",
              wordlistReviewBadge: true,
              searchBarPosition: "top",
            },
            searchValue: "",
            page: 1,
            isolatedEntry: undefined,
            results: [],
            wordlist: [],
            reviewTasks: [],
            user: readUser(),
        };
        this.handleOptionsUpdate = this.handleOptionsUpdate.bind(this);
        this.handleTextOptionsUpdate = this.handleTextOptionsUpdate.bind(this);
        this.handleSearchValueChange = this.handleSearchValueChange.bind(this);
        this.handleIsolateEntry = this.handleIsolateEntry.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleGoBack = this.handleGoBack.bind(this);
        this.handleLoadUser = this.handleLoadUser.bind(this);
        this.handleRefreshWordlist = this.handleRefreshWordlist.bind(this);
        this.handleRefreshReviewTasks = this.handleRefreshReviewTasks.bind(this);
        this.handleDictionaryUpdate = this.handleDictionaryUpdate.bind(this);
    }

    public componentDidMount() {
        window.addEventListener("scroll", this.handleScroll);
        if (!possibleLandingPages.includes(this.props.location.pathname)) {
            this.props.history.replace("/");
        }
        if (prod && (!(this.state.user?.level === "editor"))) {
            ReactGA.pageview(window.location.pathname + window.location.search);
        }
        dictionary.initialize().then((r) => {
            this.cronJob.start();
            this.setState({
                dictionaryStatus: "ready",
                dictionaryInfo: r.dictionaryInfo,
            });
            this.handleLoadUser();
            // incase it took forever and timed out - might need to reinitialize the wordlist here ??
            if (this.state.user) {
                startLocalDbs(this.state.user, { wordlist: this.handleRefreshWordlist, reviewTasks: this.handleRefreshReviewTasks });
            }
            if (this.props.location.pathname === "/word") {
                const wordId = getWordId(this.props.location.search);
                if (wordId) {
                    const word = dictionary.findOneByTs(wordId);
                    if (word) {
                        this.setState({ searchValue: word.p });
                    }
                    this.handleIsolateEntry(wordId);
                } else {
                    // TODO: Make a word not found screen
                    console.error("somehow had a word path without a word id param");
                    this.props.history.replace("/");
                }
            }
            if (this.props.location.pathname === "/share-target") {
                const searchString = getTextFromShareTarget(window.location);
                this.props.history.replace("/");
                if (this.state.options.language === "English") {
                    this.handleOptionsUpdate({ type: "toggleLanguage" });
                }
                if (this.state.options.searchType === "alphabetical") {
                    this.handleOptionsUpdate({ type: "toggleSearchType" });
                }
                this.handleSearchValueChange(searchString);
            }
            if (this.props.location.pathname === "/new-entries") {
                this.setState({
                    results: dictionary.getNewWordsThisMonth(),
                    page: 1,
                });
            }
            if (r.response === "loaded from saved") {
                this.handleDictionaryUpdate();
            }
        }).catch((error) => {
            console.error(error);
            this.setState({ dictionaryStatus: "error loading" });
        });
        document.documentElement.setAttribute("data-theme", this.state.options.theme);
        /* istanbul ignore if */
        if (window.matchMedia) {
          const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
          prefersDarkQuery.addListener((e) => {
            if (e.matches) {
              this.handleOptionsUpdate({ type: "changeTheme", payload: "dark" });
            }
          });
          const prefersLightQuery = window.matchMedia("(prefers-color-scheme: light)");
          prefersLightQuery.addListener((e) => {
            if (e.matches) {
              this.handleOptionsUpdate({ type: "changeTheme", payload: "light" });
            }
          });
        }
        Mousetrap.bind(["ctrl+down", "ctrl+up", "command+down", "command+up"], (e) => {
            if (e.repeat) return;
            this.handleOptionsUpdate({ type: "toggleLanguage" });
        });
        Mousetrap.bind(["ctrl+b", "command+b"], (e) => {
            if (e.repeat) return;
            this.handleSearchValueChange("");
        });
        Mousetrap.bind(["ctrl+\\", "command+\\"], (e) => {
            if (e.repeat) return;
            if (this.state.user?.level === "basic") return;
            if (this.props.location.pathname !== "/wordlist") {
                this.props.history.push("/wordlist");
            } else {
                this.handleGoBack();
            }
        });
    }

    public componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
        this.cronJob.stop();
        stopLocalDbs();
        Mousetrap.unbind(["ctrl+down", "ctrl+up", "command+down", "command+up"]);
        Mousetrap.unbind(["ctrl+b", "command+b"]);
        Mousetrap.unbind(["ctrl+\\", "command+\\"]);
    }

    public componentDidUpdate(prevProps: RouteComponentProps) {
        if (this.props.location.pathname !== prevProps.location.pathname) {
            if (prod && (!(this.state.user?.level === "editor"))) {
                ReactGA.pageview(window.location.pathname + window.location.search);
            }
            if (this.props.location.pathname === "/") {
                this.handleSearchValueChange("");
            }
            if (this.props.location.pathname === "/new-entries") {
                this.setState({
                    results: dictionary.getNewWordsThisMonth(),
                    page: 1,
                });
            }
            if (editorOnlyPages.includes(this.props.location.pathname) && !(this.state.user?.level === "editor")) {
                this.props.history.replace("/");
            }
        }
        if (getWordId(this.props.location.search) !== getWordId(prevProps.location.search)) {
            if (prod && ((this.state.user?.level !== "editor"))) {
                ReactGA.pageview(window.location.pathname + window.location.search);
            }
            const wordId = getWordId(this.props.location.search);
            /* istanbul ignore else */
            if (wordId) {
                this.handleIsolateEntry(wordId, true);
            } else {
                this.setState({ isolatedEntry: undefined })
            }
        }
        // if (!["/wordlist", "/settings", "/review-tasks"].includes(this.props.location.pathname)) {
        //     window.scrollTo(0, 0);
        // }
    }

    private async handleLoadUser(): Promise<void> {
        try {
            const prevUser = this.state.user;
            const userOnServer = await getUser();
            if (userOnServer === "offline") return;
            if (userOnServer) sendSubmissions();
            if (!userOnServer) {
                if (this.state.user) {
                    console.log("setting state user because user is newly undefined");
                    this.setState({ user: undefined });
                }
                saveUser(undefined);
                return;
            }
            const { userTextOptionsRecord, serverOptionsAreNewer } = resolveTextOptions(userOnServer, prevUser, this.state.options.textOptionsRecord);
            const user: AT.LingdocsUser = {
                ...userOnServer,
                userTextOptionsRecord,
            };
            if (!userObjIsEqual(prevUser, user)) {
                console.log("setting state user because something is different about the user")
                this.setState({ user });
                saveUser(user);
            }
            const textOptionsRecord: TextOptionsRecord = {
                lastModified: userTextOptionsRecord.lastModified,
                textOptions: {
                    ...userTextOptionsRecord.userTextOptions,
                    pTextSize: getTextOptions(this.state).pTextSize,
                },
            };
            this.handleOptionsUpdate({ type: "updateTextOptionsRecord", payload: textOptionsRecord });
            if (!serverOptionsAreNewer) {
                updateUserTextOptionsRecord(userTextOptionsRecord).catch(console.error);
            }
            if (user) {
                startLocalDbs(user, { wordlist: this.handleRefreshWordlist, reviewTasks: this.handleRefreshReviewTasks });
            } else {
                stopLocalDbs();
            }
        } catch (err) {
            console.error("error checking user level", err);
        }
    }

    private handleDictionaryUpdate() {
        dictionary.update(() => {
            this.setState({ dictionaryStatus: "updating" });
        }).then(({ dictionaryInfo }) => {
            if (this.state.dictionaryInfo?.release !== dictionaryInfo?.release) {
                // to avoid unnecessary re-rendering that breaks things
                this.setState({
                    dictionaryStatus: "ready",
                    dictionaryInfo,
                });
            }
        }).catch(() => {
            this.setState({ dictionaryStatus: "error loading" });
        });
    }

    private handleOptionsUpdate(action: OptionsAction) {
        if (action.type === "changeTheme") {
            document.documentElement.setAttribute("data-theme", action.payload);
        }
        // TODO: use a seperate reducer for changing text options (otherwise you could just be updating the saved text options instead of the user text options that the program is going off of)
        const options = optionsReducer(this.state.options, action);
        saveOptions(options);
        if (action.type === "toggleLanguage" || action.type === "toggleSearchType") {
            if (this.props.location.pathname !== "/new-entries") {
                this.setState(prevState => ({
                    options,
                    page: 1,
                    results: dictionary.search({ ...prevState, options }),
                }));
                window.scrollTo(0, 0);
            } else {
                this.setState({ options });
            }
        } else {
            !objIsEqual(this.state.options, options) && this.setState({ options });
        }
    }

    private handleTextOptionsUpdate(action: TextOptionsAction) {
        const textOptions = textOptionsReducer(getTextOptions(this.state), action);
        const lastModified = Date.now() as AT.TimeStamp;
        const textOptionsRecord: TextOptionsRecord = {
            lastModified,
            textOptions,
        };
        this.handleOptionsUpdate({ type: "updateTextOptionsRecord", payload: textOptionsRecord });
        // try to save the new text options to the user 
        if (this.state.user) {
            const userTextOptions = removePTextSize(textOptions);
            const userTextOptionsRecord = {
                userTextOptions,
                lastModified,
            };
            updateUserTextOptionsRecord(userTextOptionsRecord).catch(console.error);
        }
    }

    private handleSearchValueChange(searchValue: string) {
        if (this.state.dictionaryStatus !== "ready") return;
        if (searchValue === "") {
            this.setState({
                searchValue: "",
                results: [],
                page: 1,
            });
            if (this.props.location.pathname !== "/") {
                this.props.history.replace("/");
            }
            return;
        }
        this.setState(prevState => ({
            searchValue,
            results: dictionary.search({ ...prevState, searchValue }),
            page: 1,
        }));
        if (this.props.history.location.pathname !== "/search") {
            this.props.history.push("/search");
        }
        window.scrollTo(0, 0);
    }

    private handleIsolateEntry(ts: number, onlyState?: boolean) {
        window.scrollTo(0, 0);
        const isolatedEntry = dictionary.findOneByTs(ts);
        if (!isolatedEntry) {
            console.error("couldn't find word to isolate");
            return;
        }
        this.setState({ isolatedEntry });

        if (!onlyState && (this.props.location.pathname !== "/word" || (getWordId(this.props.location.search) !== ts))) {
            this.props.history.push(`/word?id=${isolatedEntry.ts}`);
        }
    }
    
    // TODO: right now not checking user very often cause it messes with the state?
    // causes the verb quizzer to reset?
    private cronJob = new CronJob("* * * * *", () => {
        this.handleDictionaryUpdate();
        this.handleLoadUser();
    })

    /* istanbul ignore next */
    private handleScroll() {
        if (hitBottom() && this.props.location.pathname === "/search" && this.state.results.length >= (pageSize * this.state.page)) {
            const page = this.state.page + 1;
            const moreResults = dictionary.search({ ...this.state, page });
            if (moreResults.length > this.state.results.length) {
                this.setState({
                    page,
                    results: moreResults,
                });
            }
        }
    }

    private handleGoBack() {
        this.props.history.goBack();
        window.scrollTo(0, 0);
    }

    private handleRefreshWordlist() {
        getWordlist().then((wordlist) => {
            this.setState({ wordlist });
        });
    }

    private handleRefreshReviewTasks() {
        getAllDocsLocalDb("reviewTasks").then((reviewTasks) => {
            this.setState({ reviewTasks });
        });
    }

    render() {
        return <div style={{
            paddingTop: this.state.options.searchBarPosition === "top" ? "75px" : "7px",
            paddingBottom: "60px",    
        }}>
            <Helmet>
                <title>LingDocs Dictionary</title>
            </Helmet>
                {this.state.options.searchBarPosition === "top" && <SearchBar
                    state={this.state}
                    optionsDispatch={this.handleOptionsUpdate}
                    handleSearchValueChange={this.handleSearchValueChange}
                />}
                <div className="container-fluid" data-testid="body">
                {this.state.dictionaryStatus !== "ready" ?
                    <DictionaryStatusDisplay status={this.state.dictionaryStatus} />
                :
                    <>
                        <Route path="/" exact>
                            <div className="text-center mt-4">
                                <h4 className="font-weight-light p-3 mb-4">LingDocs Pashto Dictionary</h4>
                                {this.state.options.searchType === "alphabetical" && <div className="mt-4 font-weight-light">
                                    <div className="mb-3"><span className="fa fa-book mr-2" ></span> Alphabetical browsing mode</div>
                                </div>}
                                {this.state.user?.level === "editor" && <div className="mt-4 font-weight-light">
                                    <div className="mb-3">Editor privileges active</div>
                                    <Link to="/edit">
                                        <button className="btn btn-secondary">New Entry</button>
                                    </Link>
                                </div>}
                                <Link to="/new-entries" className="plain-link font-weight-light">
                                    <div className="my-4">New words this month</div>
                                </Link>
                                <Link to="/phrase-builder" className="plain-link font-weight-light">
                                    <div className="my-4">Phrase Builder</div>
                                </Link>
                            </div>
                        </Route>
                        <Route path="/about">
                            <About state={this.state} />
                        </Route>
                        <Route path="/phrase-builder">
                            <PhraseBuilder state={this.state} />
                        </Route>
                        <Route path="/settings">
                            <Options
                                state={this.state}
                                options={this.state.options}
                                optionsDispatch={this.handleOptionsUpdate}
                                textOptionsDispatch={this.handleTextOptionsUpdate}
                            />
                        </Route>
                        <Route path="/search">
                            <Results state={this.state} isolateEntry={this.handleIsolateEntry} />
                        </Route>
                        <Route path="/new-entries">
                            <h4 className="mb-3">New Words This Month</h4>
                            {this.state.results.length ?
                                <Results state={this.state} isolateEntry={this.handleIsolateEntry} />
                            :
                                <div>No new words added this month 😓</div>
                            }
                        </Route>
                        <Route path="/account">
                            <Account user={this.state.user} loadUser={this.handleLoadUser} />
                        </Route>
                        <Route path="/word">
                            <IsolatedEntry
                                state={this.state}
                                dictionary={dictionary}
                                isolateEntry={this.handleIsolateEntry}
                            />
                        </Route>
                        {wordlistEnabled(this.state.user) && <Route path="/wordlist">
                            <Wordlist
                                options={this.state.options}
                                wordlist={this.state.wordlist}
                                isolateEntry={this.handleIsolateEntry}
                                optionsDispatch={this.handleOptionsUpdate}
                            />
                        </Route>}
                        {this.state.user?.level === "editor" && <Route path="/edit">
                            <EntryEditor
                                isolatedEntry={this.state.isolatedEntry}
                                user={this.state.user}
                                textOptions={getTextOptions(this.state)}
                                dictionary={dictionary}
                                searchParams={new URLSearchParams(this.props.history.location.search)}
                            />
                        </Route>}
                        {this.state.user?.level === "editor" && <Route path="/review-tasks">
                            <ReviewTasks state={this.state} />
                        </Route>}
                    </>
                }
            </div>
            <footer className={classNames(
                "footer",
                { "bg-white": !["/search", "/word"].includes(this.props.location.pathname) },
                { "footer-thick": this.state.options.searchBarPosition === "bottom" && !["/search", "/word"].includes(this.props.location.pathname) },
                { "wee-less-footer": this.state.options.searchBarPosition === "bottom" && ["/search", "/word"].includes(this.props.location.pathname) },
            )}>
                <Route path="/" exact>
                    <div className="buttons-footer">
                        <BottomNavItem label="About" icon="info-circle" page="/about" />
                        <BottomNavItem label="Settings" icon="cog" page="/settings" />
                        <BottomNavItem label={this.state.user ? "Account" : "Sign In"} icon="user" page="/account" />
                        {wordlistEnabled(this.state.user) &&
                            <BottomNavItem
                                label={`Wordlist ${this.state.options.wordlistReviewBadge ? textBadge(forReview(this.state.wordlist).length) : ""}`}
                                icon="list"
                                page="/wordlist"
                            />
                        }
                        {this.state.user?.level === "editor" &&
                            <BottomNavItem
                                label={`Tasks ${textBadge(this.state.reviewTasks.length)}`}
                                icon="edit"
                                page="/review-tasks"
                            />
                        }
                    </div>
                </Route>
                <Route path={["/about", "/settings", "/new-entries", "/account", "/wordlist", "/edit", "/review-tasks", "/phrase-builder"]}>
                    <div className="buttons-footer">
                        <BottomNavItem label="Home" icon="home" page="/" />
                    </div>
                </Route>
                {this.state.options.searchBarPosition === "bottom" && <SearchBar
                    state={this.state}
                    optionsDispatch={this.handleOptionsUpdate}
                    handleSearchValueChange={this.handleSearchValueChange}
                    onBottom
                />}
            </footer>
        </div>;
    }
}

export default withRouter(App);
