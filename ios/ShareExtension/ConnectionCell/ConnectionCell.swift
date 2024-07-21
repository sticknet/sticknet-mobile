//
//  ConnectionCell.swift
//  ShareExtension
//
//  Created by Omar Basem on 05/03/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

import UIKit

class ConnectionCell: UITableViewCell {

  @IBOutlet weak var picture: UIImageView!
  @IBOutlet weak var name: UILabel!
  
  @IBOutlet weak var username: UILabel!
  @IBOutlet weak var check: UIImageView!
  override func awakeFromNib() {
        super.awakeFromNib()
        // Initialization code
    }

    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)

        // Configure the view for the selected state
    }
    
}
