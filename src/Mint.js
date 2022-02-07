import React, { useState } from "react";
import {
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Transfer from "./Transfer";

const Mint = ({ setLoading, provider, walletConnected, loading }) => {
  const [isTokenCreated, setIsTokenCreated] = useState(false);
  const [createdTokenPublicKey, setCreatedTokenPublicKey] = useState(null);
  const [mintingWalletSecretKey, setMintingWalletSecretKey] = useState(null);
  const [supplyCapped, setSupplyCapped] = useState(false);

  const props = {
    setLoading,
    mintingWalletSecretKey,
    Token,
    createdTokenPublicKey,
    TOKEN_PROGRAM_ID,
    provider,
    loading,
    supplyCapped,
  };

  const initialMintHelper = async () => {
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const mintRequester = await provider.publicKey;
      const mintingFromWallet = await Keypair.generate();
      setMintingWalletSecretKey(JSON.stringify(mintingFromWallet.secretKey));

      const fromAirDropSignature = await connection.requestAirdrop(
        mintingFromWallet.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature, {
        commitment: "confirmed",
      });

      const creatorToken = await Token.createMint(
        connection,
        mintingFromWallet,
        mintingFromWallet.publicKey,
        null,
        6,
        TOKEN_PROGRAM_ID
      );
      const fromTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(
          mintingFromWallet.publicKey
        );
      await creatorToken.mintTo(
        fromTokenAccount.address,
        mintingFromWallet.publicKey,
        [],
        1000000
      );

      const toTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(mintRequester);
      const transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount.address,
          toTokenAccount.address,
          mintingFromWallet.publicKey,
          [],
          1000000
        )
      );
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [mintingFromWallet],
        { commitment: "confirmed" }
      );

      console.log("SIGNATURE:", signature);
      setCreatedTokenPublicKey(creatorToken.publicKey.toString());
      setIsTokenCreated(true);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };
  const capSupplyHelper = async () => {
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const createMintingWallet = await Keypair.fromSecretKey(
        Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey)))
      );
      const fromAirDropSignature = await connection.requestAirdrop(
        createMintingWallet.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature);

      const creatorToken = new Token(
        connection,
        createdTokenPublicKey,
        TOKEN_PROGRAM_ID,
        createMintingWallet
      );
      await creatorToken.setAuthority(
        createdTokenPublicKey,
        null,
        "MintTokens",
        createMintingWallet.publicKey,
        [createMintingWallet]
      );

      setSupplyCapped(true);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const mintAgainHelper = async () => {
    try {
      setLoading(true);
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const createMintingWallet = await Keypair.fromSecretKey(
        Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey)))
      );
      const mintRequester = await provider.publicKey;

      const fromAirDropSignature = await connection.requestAirdrop(
        createMintingWallet.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature, {
        commitment: "confirmed",
      });

      const creatorToken = new Token(
        connection,
        createdTokenPublicKey,
        TOKEN_PROGRAM_ID,
        createMintingWallet
      );
      const fromTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(
          createMintingWallet.publicKey
        );
      const toTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(mintRequester);
      await creatorToken.mintTo(
        fromTokenAccount.address,
        createMintingWallet.publicKey,
        [],
        100000000
      );

      const transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount.address,
          toTokenAccount.address,
          createMintingWallet.publicKey,
          [],
          100000000
        )
      );
      await sendAndConfirmTransaction(
        connection,
        transaction,
        [createMintingWallet],
        { commitment: "confirmed" }
      );

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <div>
      {walletConnected ? (
        <p>
          Create your own token
          <button disabled={loading} onClick={initialMintHelper}>
            Initial Mint{" "}
          </button>
          <br />
          Mint More 100 tokens:{" "}
          <button disabled={loading || supplyCapped} onClick={mintAgainHelper}>
            Mint Again
          </button>
          <div>
            <Transfer {...props} />
          </div>
        </p>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Mint;
