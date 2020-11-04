import { BigInt } from "@graphprotocol/graph-ts"
import {
    Contract,
    StreamCanceled,
    StreamCreated,
    StreamFunded,
    WithdrawFromStream
} from "../generated/Contract/Contract"
import { Cancellation, Stream, Withdrawal, Fund } from "../generated/schema"
import { addStreamTransaction } from "./transactions";
import { addToken } from "./tokens";

export function handleStreamCreated(event: StreamCreated): void {
    /* Create the stream object */
    let streamId = event.params.streamId.toString();
    let stream = new Stream(streamId);
    stream.depositAmount = event.params.depositAmount;
    stream.recipient = event.params.recipient;
    stream.sender = event.params.sender;
    stream.startBlock = event.params.startBlock;
    stream.kBlock = event.params.kBlock;
    stream.unlockRatio = event.params.unlockRatio;
    stream.timestamp = event.block.timestamp;
    stream.token = event.params.tokenAddress.toHex();
    stream.save();

    /* Create adjacent but important objects */
    addStreamTransaction("CreateStream", event, streamId);
    addToken(event.params.tokenAddress.toHex());
}

export function handleStreamFunded(event: StreamFunded): void {
    let streamId = event.params.streamId.toString();
    let stream = Stream.load(streamId);
    if (stream == null) {
        return;
    }

    let fund = new Fund(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    fund.amount = event.params.amount;
    fund.stream = streamId;
    fund.timestamp = event.block.timestamp;
    fund.token = stream.token;
    fund.save();

    addStreamTransaction("FundStream", event, streamId);
}

export function handleWithdrawFromStream(event: WithdrawFromStream): void {
    let streamId = event.params.streamId.toString();
    let stream = Stream.load(streamId);
    if (stream == null) {
        return;
    }

    let withdrawal = new Withdrawal(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    withdrawal.amount = event.params.amount;
    withdrawal.stream = streamId;
    withdrawal.timestamp = event.block.timestamp;
    withdrawal.token = stream.token;
    withdrawal.save();

    addStreamTransaction("WithdrawFromStream", event, streamId);
}

export function handleStreamCanceled(event: StreamCanceled): void {
    let streamId = event.params.streamId.toString();
    let stream = Stream.load(streamId);
    if (stream == null) {
        return;
    }

    let cancellation = new Cancellation(streamId);
    cancellation.recipientBalance = event.params.recipientBalance;
    cancellation.senderBalance = event.params.senderBalance;
    cancellation.timestamp = event.block.timestamp;
    cancellation.token = stream.token;
    cancellation.txhash = event.transaction.hash.toHex();
    cancellation.save();

    stream.cancellation = streamId;
    stream.save();

    addStreamTransaction("CancelStream", event, streamId);
}