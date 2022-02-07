import React from "react";
import {
  Keypair,
  Transaction,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

const Transfer = ({
  setLoading,
  mintingWalletSecretKey,
  Token,
  createdTokenPublicKey,
  TOKEN_PROGRAM_ID,
  provider,
  loading,
  supplyCapped,
}) => {
  const transferTokenHelper = async () => {
    try {
      setLoading(true);

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const createMintingWallet = Keypair.fromSecretKey(
        Uint8Array.from(Object.values(JSON.parse(mintingWalletSecretKey)))
      );
      const receiverWallet = new PublicKey(
        "5eaFQvgJgvW4rDjcAaKwdBb6ZAJ6avWimftFyjnQB3Aj"
      );

      const fromAirDropSignature = await connection.requestAirdrop(
        createMintingWallet.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature, {
        commitment: "confirmed",
      });
      console.log("1 SOL airdropped to the wallet for fee");

      const creatorToken = new Token(
        connection,
        createdTokenPublicKey,
        TOKEN_PROGRAM_ID,
        createMintingWallet
      );
      const fromTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(provider.publicKey);
      const toTokenAccount =
        await creatorToken.getOrCreateAssociatedAccountInfo(receiverWallet);

      const transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount.address,
          toTokenAccount.address,
          provider.publicKey,
          [],
          10000000
        )
      );
      transaction.feePayer = provider.publicKey;
      let blockhashObj = await connection.getRecentBlockhash();
      console.log("blockhashObj", blockhashObj);
      transaction.recentBlockhash = await blockhashObj.blockhash;

      if (transaction) {
        console.log("Txn created successfully");
      }

      let signed = await provider.signTransaction(transaction);
      let signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      console.log("SIGNATURE: ", signature);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };
  return (
    <div>
      {" "}
      Transfer your tokens:
      <button disabled={loading || supplyCapped} onClick={transferTokenHelper}>
        Transfer token
      </button>
    </div>
  );
};

export default Transfer;
