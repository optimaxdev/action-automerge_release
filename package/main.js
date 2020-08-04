"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const init_1 = __importDefault(require("./init"));
const repo_api_1 = require("./lib/repo-api");
const log_1 = require("./lib/log");
const merge_to_release_1 = require("./merge-to-release");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.debug(new Date().toTimeString());
            const initResult = init_1.default();
            if (!initResult) {
                return;
            }
            const { pushDescription, octokit, contextEnv } = initResult;
            const branchesList = yield repo_api_1.fetchReleaseBranchesNamesByAPI(octokit, pushDescription, contextEnv);
            log_1.debug('Fetched branches', branchesList);
            yield merge_to_release_1.mergeToRelated(octokit, pushDescription, contextEnv, branchesList);
        }
        catch (err) {
            log_1.error(err);
            core.setFailed(err.message);
        }
    });
}
run();
